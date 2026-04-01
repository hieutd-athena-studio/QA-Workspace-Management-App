# Category Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unlimited-depth `folder` tree with a strict 2-level `category` / `subcategory` structure, where test cases can only belong to sub-categories.

**Architecture:** Two separate DB tables (`category`, `subcategory`) enforce the 2-level constraint at the schema level. A migration (004) wipes old folder/test-case data and recreates the tables clean. The frontend replaces `FolderTree` with a new `CategoryPanel` component that shows categories as expandable groups and sub-categories as selectable items.

**Tech Stack:** Electron + better-sqlite3 (main), React 18 + TypeScript (renderer), IPC via contextBridge preload, CSS per component (no Tailwind).

---

## File Map

| Action | File |
|--------|------|
| Create | `src/main/database/migrations/004-restructure-categories.ts` |
| Modify | `src/main/database/connection.ts` |
| Delete | `src/shared/types/folder.ts` |
| Create | `src/shared/types/category.ts` |
| Create | `src/shared/types/subcategory.ts` |
| Modify | `src/shared/types/test-case.ts` |
| Modify | `src/shared/types/assignment.ts` |
| Modify | `src/shared/types/index.ts` |
| Modify | `src/shared/ipc-channels.ts` |
| Delete | `src/main/database/repositories/folder.repo.ts` |
| Create | `src/main/database/repositories/category.repo.ts` |
| Create | `src/main/database/repositories/subcategory.repo.ts` |
| Modify | `src/main/database/repositories/test-case.repo.ts` |
| Modify | `src/main/database/repositories/assignment.repo.ts` |
| Delete | `src/main/ipc/folder.handlers.ts` |
| Create | `src/main/ipc/category.handlers.ts` |
| Create | `src/main/ipc/subcategory.handlers.ts` |
| Modify | `src/main/ipc/test-case.handlers.ts` |
| Modify | `src/main/ipc/register-all.ts` |
| Modify | `src/preload/index.ts` |
| Delete | `src/renderer/components/folder-tree/FolderTree.tsx` |
| Delete | `src/renderer/components/folder-tree/FolderNode.tsx` |
| Delete | `src/renderer/components/folder-tree/FolderTree.css` |
| Create | `src/renderer/components/category-panel/CategoryPanel.tsx` |
| Create | `src/renderer/components/category-panel/CategoryPanel.css` |
| Modify | `src/renderer/pages/TestLibraryPage.tsx` |
| Modify | `src/renderer/components/test-cases/TestCaseList.tsx` |
| Modify | `src/renderer/components/test-cases/TestCaseForm.tsx` |
| Modify | `src/renderer/pages/TestCycleDetailPage.tsx` |
| Modify | `src/renderer/components/execution/AssignmentPicker.tsx` |

---

## Task 1: Database Migration

**Files:**
- Create: `src/main/database/migrations/004-restructure-categories.ts`
- Modify: `src/main/database/connection.ts`

- [ ] **Step 1: Create migration file**

Create `src/main/database/migrations/004-restructure-categories.ts`:

```typescript
import type Database from 'better-sqlite3'

export function runMigration004(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS test_case_assignment;
    DROP TABLE IF EXISTS test_case;
    DROP TABLE IF EXISTS folder;

    CREATE TABLE IF NOT EXISTS category (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_category_project ON category(project_id);

    CREATE TABLE IF NOT EXISTS subcategory (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
      project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_subcategory_category ON subcategory(category_id);
    CREATE INDEX IF NOT EXISTS idx_subcategory_project ON subcategory(project_id);

    CREATE TABLE IF NOT EXISTS test_case (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      display_id      TEXT    NOT NULL DEFAULT '',
      title           TEXT    NOT NULL,
      description     TEXT    NOT NULL DEFAULT '',
      steps           TEXT    NOT NULL DEFAULT '[]',
      expected_result TEXT    NOT NULL DEFAULT '',
      version         TEXT    NOT NULL DEFAULT '',
      subcategory_id  INTEGER NOT NULL REFERENCES subcategory(id) ON DELETE CASCADE,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_test_case_subcategory ON test_case(subcategory_id);

    CREATE TABLE IF NOT EXISTS test_case_assignment (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      test_cycle_id  INTEGER NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
      test_case_id   INTEGER NOT NULL REFERENCES test_case(id) ON DELETE CASCADE,
      status         TEXT    NOT NULL DEFAULT 'Unexecuted'
                     CHECK (status IN ('Pass', 'Fail', 'Blocked', 'Unexecuted')),
      bug_ref        TEXT,
      executed_at    TEXT,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(test_cycle_id, test_case_id)
    );
    CREATE INDEX IF NOT EXISTS idx_assignment_cycle ON test_case_assignment(test_cycle_id);
    CREATE INDEX IF NOT EXISTS idx_assignment_test_case ON test_case_assignment(test_case_id);
  `)
}
```

- [ ] **Step 2: Register migration in connection.ts**

In `src/main/database/connection.ts`, add the import and the call:

```typescript
import Database from 'better-sqlite3'
import { runMigrations } from './migrations/001-initial-schema'
import { runMigration002 } from './migrations/002-add-projects'
import { runMigration003 } from './migrations/003-add-test-case-version'
import { runMigration004 } from './migrations/004-restructure-categories'

let dbInstance: Database.Database | null = null

export function createDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  runMigration002(db)
  runMigration003(db)
  runMigration004(db)
  return db
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return dbInstance
}

export function initDatabase(dbPath: string): Database.Database {
  if (dbInstance) return dbInstance
  dbInstance = createDatabase(dbPath)
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/main/database/migrations/004-restructure-categories.ts src/main/database/connection.ts
git commit -m "feat: add migration 004 to restructure folder→category/subcategory schema"
```

---

## Task 2: Shared Types

**Files:**
- Create: `src/shared/types/category.ts`
- Create: `src/shared/types/subcategory.ts`
- Modify: `src/shared/types/test-case.ts`
- Modify: `src/shared/types/assignment.ts`
- Modify: `src/shared/types/index.ts`

Note: `src/shared/types/folder.ts` is deleted in Task 10 after the renderer no longer imports it.

- [ ] **Step 1: Create category.ts**

Create `src/shared/types/category.ts`:

```typescript
export interface Category {
  id: number
  name: string
  project_id: number
  created_at: string
  updated_at: string
}

export interface CreateCategoryDTO {
  name: string
  project_id: number
}

export interface UpdateCategoryDTO {
  name?: string
}
```

- [ ] **Step 2: Create subcategory.ts**

Create `src/shared/types/subcategory.ts`:

```typescript
export interface Subcategory {
  id: number
  name: string
  category_id: number
  project_id: number
  created_at: string
  updated_at: string
}

export interface CreateSubcategoryDTO {
  name: string
  category_id: number
  project_id: number
}

export interface UpdateSubcategoryDTO {
  name?: string
}
```

- [ ] **Step 3: Update test-case.ts**

Replace `folder_id` with `subcategory_id` throughout. Full file content:

```typescript
export interface TestStep {
  step: number
  action: string
  expected: string
}

export interface TestCase {
  id: number
  display_id: string
  title: string
  description: string
  steps: TestStep[]
  expected_result: string
  version: string
  subcategory_id: number
  created_at: string
  updated_at: string
}

export interface CreateTestCaseDTO {
  title: string
  description: string
  steps: TestStep[]
  expected_result: string
  version: string
  subcategory_id: number
}

export interface UpdateTestCaseDTO {
  title?: string
  description?: string
  steps?: TestStep[]
  expected_result?: string
  version?: string
  subcategory_id?: number
}
```

- [ ] **Step 4: Update assignment.ts**

Replace `folder_path` with `category_name` + `subcategory_name`. Full file content:

```typescript
export type ExecutionStatus = 'Pass' | 'Fail' | 'Blocked' | 'Unexecuted'

export interface TestCaseAssignment {
  id: number
  test_cycle_id: number
  test_case_id: number
  status: ExecutionStatus
  bug_ref: string | null
  executed_at: string | null
  created_at: string
  updated_at: string
  // Joined fields from test_case
  test_case_title?: string
  test_case_description?: string
  test_case_steps?: string
  test_case_expected_result?: string
  // Joined fields from subcategory + category
  category_name?: string
  subcategory_name?: string
}

export interface UpdateAssignmentStatusDTO {
  status: ExecutionStatus
  bug_ref?: string | null
}
```

- [ ] **Step 5: Update index.ts**

Replace the `folder` export with `category` and `subcategory`. Full file content:

```typescript
export * from './project'
export * from './category'
export * from './subcategory'
export * from './test-case'
export * from './test-plan'
export * from './test-cycle'
export * from './assignment'
export * from './report'
export * from './ipc-result'
```

- [ ] **Step 6: Commit**

```bash
git add src/shared/types/category.ts src/shared/types/subcategory.ts src/shared/types/test-case.ts src/shared/types/assignment.ts src/shared/types/index.ts
git commit -m "feat: replace Folder types with Category and Subcategory types"
```

---

## Task 3: IPC Channels

**Files:**
- Modify: `src/shared/ipc-channels.ts`

- [ ] **Step 1: Replace FOLDERS with CATEGORIES + SUBCATEGORIES, update TEST_CASES**

Full file content for `src/shared/ipc-channels.ts`:

```typescript
export const IPC = {
  PROJECTS: {
    GET_ALL: 'projects:get-all',
    GET_BY_ID: 'projects:get-by-id',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete'
  },
  CATEGORIES: {
    GET_BY_PROJECT: 'categories:get-by-project',
    GET_BY_ID: 'categories:get-by-id',
    CREATE: 'categories:create',
    RENAME: 'categories:rename',
    DELETE: 'categories:delete'
  },
  SUBCATEGORIES: {
    GET_BY_PROJECT: 'subcategories:get-by-project',
    GET_BY_CATEGORY: 'subcategories:get-by-category',
    GET_BY_ID: 'subcategories:get-by-id',
    CREATE: 'subcategories:create',
    RENAME: 'subcategories:rename',
    DELETE: 'subcategories:delete'
  },
  TEST_CASES: {
    GET_BY_SUBCATEGORY: 'test-cases:get-by-subcategory',
    GET_BY_ID: 'test-cases:get-by-id',
    CREATE: 'test-cases:create',
    UPDATE: 'test-cases:update',
    DELETE: 'test-cases:delete',
    SEARCH: 'test-cases:search'
  },
  TEST_PLANS: {
    GET_ALL: 'test-plans:get-all',
    GET_BY_PROJECT: 'test-plans:get-by-project',
    GET_BY_ID: 'test-plans:get-by-id',
    CREATE: 'test-plans:create',
    UPDATE: 'test-plans:update',
    DELETE: 'test-plans:delete'
  },
  TEST_CYCLES: {
    GET_BY_PLAN: 'test-cycles:get-by-plan',
    GET_BY_ID: 'test-cycles:get-by-id',
    CREATE: 'test-cycles:create',
    UPDATE: 'test-cycles:update',
    DELETE: 'test-cycles:delete'
  },
  ASSIGNMENTS: {
    GET_BY_CYCLE: 'assignments:get-by-cycle',
    ASSIGN: 'assignments:assign',
    UNASSIGN: 'assignments:unassign',
    UPDATE_STATUS: 'assignments:update-status'
  },
  REPORTS: {
    GENERATE: 'reports:generate',
    GET_DATA: 'reports:get-data',
    GET_BY_CYCLE: 'reports:get-by-cycle'
  }
} as const
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/ipc-channels.ts
git commit -m "feat: replace FOLDERS IPC channels with CATEGORIES and SUBCATEGORIES"
```

---

## Task 4: Repositories

**Files:**
- Create: `src/main/database/repositories/category.repo.ts`
- Create: `src/main/database/repositories/subcategory.repo.ts`
- Modify: `src/main/database/repositories/test-case.repo.ts`
- Modify: `src/main/database/repositories/assignment.repo.ts`

- [ ] **Step 1: Create category.repo.ts**

Create `src/main/database/repositories/category.repo.ts`:

```typescript
import type Database from 'better-sqlite3'
import type { Category, CreateCategoryDTO } from '@shared/types'

export class CategoryRepository {
  constructor(private db: Database.Database) {}

  getByProject(projectId: number): Category[] {
    return this.db.prepare(
      'SELECT * FROM category WHERE project_id = ? ORDER BY name'
    ).all(projectId) as Category[]
  }

  getById(id: number): Category | undefined {
    return this.db.prepare(
      'SELECT * FROM category WHERE id = ?'
    ).get(id) as Category | undefined
  }

  create(dto: CreateCategoryDTO): Category {
    const result = this.db.prepare(
      'INSERT INTO category (name, project_id) VALUES (?, ?)'
    ).run(dto.name, dto.project_id)
    return this.getById(Number(result.lastInsertRowid))!
  }

  rename(id: number, name: string): Category {
    this.db.prepare(
      `UPDATE category SET name = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(name, id)
    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM category WHERE id = ?').run(id)
  }
}
```

- [ ] **Step 2: Create subcategory.repo.ts**

Create `src/main/database/repositories/subcategory.repo.ts`:

```typescript
import type Database from 'better-sqlite3'
import type { Subcategory, CreateSubcategoryDTO } from '@shared/types'

export class SubcategoryRepository {
  constructor(private db: Database.Database) {}

  getByProject(projectId: number): Subcategory[] {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE project_id = ? ORDER BY name'
    ).all(projectId) as Subcategory[]
  }

  getByCategory(categoryId: number): Subcategory[] {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE category_id = ? ORDER BY name'
    ).all(categoryId) as Subcategory[]
  }

  getById(id: number): Subcategory | undefined {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE id = ?'
    ).get(id) as Subcategory | undefined
  }

  create(dto: CreateSubcategoryDTO): Subcategory {
    const result = this.db.prepare(
      'INSERT INTO subcategory (name, category_id, project_id) VALUES (?, ?, ?)'
    ).run(dto.name, dto.category_id, dto.project_id)
    return this.getById(Number(result.lastInsertRowid))!
  }

  rename(id: number, name: string): Subcategory {
    this.db.prepare(
      `UPDATE subcategory SET name = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(name, id)
    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM subcategory WHERE id = ?').run(id)
  }
}
```

- [ ] **Step 3: Rewrite test-case.repo.ts**

Full file content for `src/main/database/repositories/test-case.repo.ts`:

```typescript
import type Database from 'better-sqlite3'
import type { TestCase, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import { parseSteps, serializeSteps } from '@shared/utils/steps'

export class TestCaseRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: Record<string, unknown>): TestCase {
    return {
      ...row,
      steps: parseSteps(row.steps as string)
    } as unknown as TestCase
  }

  private generateDisplayId(subcategoryId: number): string {
    const row = this.db.prepare(`
      SELECT p.code, COUNT(tc.id) as count
      FROM project p
      JOIN category cat ON cat.project_id = p.id
      JOIN subcategory sub ON sub.category_id = cat.id
      LEFT JOIN test_case tc ON tc.subcategory_id IN (
        SELECT sub2.id FROM subcategory sub2
        JOIN category cat2 ON sub2.category_id = cat2.id
        WHERE cat2.project_id = p.id
      )
      WHERE sub.id = ?
      GROUP BY p.id
    `).get(subcategoryId) as { code: string; count: number } | undefined

    if (!row) return `TC${String(1).padStart(3, '0')}`
    return `${row.code}-TC${String(row.count + 1).padStart(3, '0')}`
  }

  getBySubcategory(subcategoryId: number): TestCase[] {
    const rows = this.db.prepare(
      'SELECT * FROM test_case WHERE subcategory_id = ? ORDER BY title'
    ).all(subcategoryId) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }

  getById(id: number): TestCase | undefined {
    const row = this.db.prepare(
      'SELECT * FROM test_case WHERE id = ?'
    ).get(id) as Record<string, unknown> | undefined
    return row ? this.mapRow(row) : undefined
  }

  create(dto: CreateTestCaseDTO): TestCase {
    const displayId = this.generateDisplayId(dto.subcategory_id)
    const result = this.db.prepare(
      'INSERT INTO test_case (display_id, title, description, steps, expected_result, version, subcategory_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(displayId, dto.title, dto.description, serializeSteps(dto.steps), dto.expected_result, dto.version, dto.subcategory_id)
    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateTestCaseDTO): TestCase {
    const existing = this.getById(id)
    if (!existing) throw new Error('Test case not found')

    this.db.prepare(
      `UPDATE test_case SET
        title = ?,
        description = ?,
        steps = ?,
        expected_result = ?,
        version = ?,
        subcategory_id = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.title ?? existing.title,
      dto.description ?? existing.description,
      dto.steps ? serializeSteps(dto.steps) : serializeSteps(existing.steps),
      dto.expected_result ?? existing.expected_result,
      dto.version ?? existing.version,
      dto.subcategory_id ?? existing.subcategory_id,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM test_case WHERE id = ?').run(id)
  }

  search(query: string, projectId?: number): TestCase[] {
    if (projectId !== undefined) {
      const rows = this.db.prepare(
        `SELECT tc.* FROM test_case tc
         JOIN subcategory sub ON tc.subcategory_id = sub.id
         WHERE sub.project_id = ? AND (tc.title LIKE ? OR tc.description LIKE ?)
         ORDER BY tc.title LIMIT 50`
      ).all(projectId, `%${query}%`, `%${query}%`) as Record<string, unknown>[]
      return rows.map(r => this.mapRow(r))
    }
    const rows = this.db.prepare(
      `SELECT * FROM test_case WHERE title LIKE ? OR description LIKE ? ORDER BY title LIMIT 50`
    ).all(`%${query}%`, `%${query}%`) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }
}
```

- [ ] **Step 4: Update assignment.repo.ts**

Replace all `folder` joins with `subcategory` + `category` joins and swap `folder_path` for `category_name` + `subcategory_name`. Full file content:

```typescript
import type Database from 'better-sqlite3'
import type { TestCaseAssignment, UpdateAssignmentStatusDTO } from '@shared/types'

export class AssignmentRepository {
  constructor(private db: Database.Database) {}

  getByCycle(cycleId: number): TestCaseAssignment[] {
    return this.db.prepare(`
      SELECT a.*,
        tc.title as test_case_title,
        tc.description as test_case_description,
        tc.steps as test_case_steps,
        tc.expected_result as test_case_expected_result,
        cat.name as category_name,
        sub.name as subcategory_name
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN subcategory sub ON tc.subcategory_id = sub.id
      JOIN category cat ON sub.category_id = cat.id
      WHERE a.test_cycle_id = ?
      ORDER BY cat.name, sub.name, tc.title
    `).all(cycleId) as TestCaseAssignment[]
  }

  getByCycleFiltered(cycleId: number): TestCaseAssignment[] {
    return this.db.prepare(`
      SELECT a.*,
        tc.title as test_case_title,
        tc.description as test_case_description,
        tc.steps as test_case_steps,
        tc.expected_result as test_case_expected_result,
        cat.name as category_name,
        sub.name as subcategory_name
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN subcategory sub ON tc.subcategory_id = sub.id
      JOIN category cat ON sub.category_id = cat.id
      WHERE a.test_cycle_id = ?
      ORDER BY cat.name, sub.name, tc.title
    `).all(cycleId) as TestCaseAssignment[]
  }

  assign(cycleId: number, testCaseIds: number[]): void {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO test_case_assignment (test_cycle_id, test_case_id) VALUES (?, ?)'
    )

    const assignAll = this.db.transaction(() => {
      for (const tcId of testCaseIds) {
        insert.run(cycleId, tcId)
      }
    })

    assignAll()
  }

  unassign(assignmentId: number): void {
    this.db.prepare('DELETE FROM test_case_assignment WHERE id = ?').run(assignmentId)
  }

  updateStatus(id: number, dto: UpdateAssignmentStatusDTO): TestCaseAssignment {
    const executedAt = dto.status !== 'Unexecuted' ? new Date().toISOString() : null

    this.db.prepare(
      `UPDATE test_case_assignment SET
        status = ?,
        bug_ref = ?,
        executed_at = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(dto.status, dto.bug_ref ?? null, executedAt, id)

    return this.db.prepare(`
      SELECT a.*,
        tc.title as test_case_title,
        tc.description as test_case_description,
        tc.steps as test_case_steps,
        tc.expected_result as test_case_expected_result,
        cat.name as category_name,
        sub.name as subcategory_name
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN subcategory sub ON tc.subcategory_id = sub.id
      JOIN category cat ON sub.category_id = cat.id
      WHERE a.id = ?
    `).get(id) as TestCaseAssignment
  }

  getStatsByCycle(cycleId: number): { total: number; passed: number; failed: number; blocked: number; unexecuted: number } {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = 'Fail' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'Unexecuted' THEN 1 ELSE 0 END) as unexecuted
      FROM test_case_assignment
      WHERE test_cycle_id = ?
    `).get(cycleId) as { total: number; passed: number; failed: number; blocked: number; unexecuted: number }

    return row
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/main/database/repositories/category.repo.ts src/main/database/repositories/subcategory.repo.ts src/main/database/repositories/test-case.repo.ts src/main/database/repositories/assignment.repo.ts
git commit -m "feat: add category/subcategory repos, update test-case and assignment repos"
```

---

## Task 5: IPC Handlers + Register

**Files:**
- Create: `src/main/ipc/category.handlers.ts`
- Create: `src/main/ipc/subcategory.handlers.ts`
- Modify: `src/main/ipc/test-case.handlers.ts`
- Modify: `src/main/ipc/register-all.ts`

- [ ] **Step 1: Create category.handlers.ts**

Create `src/main/ipc/category.handlers.ts`:

```typescript
import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { CategoryRepository } from '../database/repositories/category.repo'
import { getDatabase } from '../database/connection'

export function registerCategoryHandlers(): void {
  const repo = new CategoryRepository(getDatabase())

  ipcMain.handle(IPC.CATEGORIES.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('CAT_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.GET_BY_ID, (_e, id: number) => {
    try {
      const cat = repo.getById(id)
      if (!cat) return wrapError('CAT_NOT_FOUND', 'Category not found')
      return wrapSuccess(cat)
    } catch (e: unknown) {
      return wrapError('CAT_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('CAT_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.RENAME, (_e, id: number, name: string) => {
    try {
      return wrapSuccess(repo.rename(id, name))
    } catch (e: unknown) {
      return wrapError('CAT_RENAME', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('CAT_DELETE', (e as Error).message)
    }
  })
}
```

- [ ] **Step 2: Create subcategory.handlers.ts**

Create `src/main/ipc/subcategory.handlers.ts`:

```typescript
import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { SubcategoryRepository } from '../database/repositories/subcategory.repo'
import { getDatabase } from '../database/connection'

export function registerSubcategoryHandlers(): void {
  const repo = new SubcategoryRepository(getDatabase())

  ipcMain.handle(IPC.SUBCATEGORIES.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('SUBCAT_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.GET_BY_CATEGORY, (_e, categoryId: number) => {
    try {
      return wrapSuccess(repo.getByCategory(categoryId))
    } catch (e: unknown) {
      return wrapError('SUBCAT_GET_BY_CATEGORY', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.GET_BY_ID, (_e, id: number) => {
    try {
      const sub = repo.getById(id)
      if (!sub) return wrapError('SUBCAT_NOT_FOUND', 'Sub-category not found')
      return wrapSuccess(sub)
    } catch (e: unknown) {
      return wrapError('SUBCAT_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('SUBCAT_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.RENAME, (_e, id: number, name: string) => {
    try {
      return wrapSuccess(repo.rename(id, name))
    } catch (e: unknown) {
      return wrapError('SUBCAT_RENAME', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('SUBCAT_DELETE', (e as Error).message)
    }
  })
}
```

- [ ] **Step 3: Update test-case.handlers.ts**

Change `GET_BY_FOLDER` → `GET_BY_SUBCATEGORY` and `getByFolder` → `getBySubcategory`. Full file content:

```typescript
import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { TestCaseRepository } from '../database/repositories/test-case.repo'
import { getDatabase } from '../database/connection'

export function registerTestCaseHandlers(): void {
  const repo = new TestCaseRepository(getDatabase())

  ipcMain.handle(IPC.TEST_CASES.GET_BY_SUBCATEGORY, (_e, subcategoryId: number) => {
    try {
      return wrapSuccess(repo.getBySubcategory(subcategoryId))
    } catch (e: unknown) {
      return wrapError('TC_GET_BY_SUBCATEGORY', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.GET_BY_ID, (_e, id: number) => {
    try {
      const tc = repo.getById(id)
      if (!tc) return wrapError('TC_NOT_FOUND', 'Test case not found')
      return wrapSuccess(tc)
    } catch (e: unknown) {
      return wrapError('TC_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('TC_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.UPDATE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.update(id, dto))
    } catch (e: unknown) {
      return wrapError('TC_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('TC_DELETE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.SEARCH, (_e, query: string, projectId?: number) => {
    try {
      return wrapSuccess(repo.search(query, projectId))
    } catch (e: unknown) {
      return wrapError('TC_SEARCH', (e as Error).message)
    }
  })
}
```

- [ ] **Step 4: Update register-all.ts**

Replace `registerFolderHandlers` with `registerCategoryHandlers` + `registerSubcategoryHandlers`. Full file content:

```typescript
import { registerProjectHandlers } from './project.handlers'
import { registerCategoryHandlers } from './category.handlers'
import { registerSubcategoryHandlers } from './subcategory.handlers'
import { registerTestCaseHandlers } from './test-case.handlers'
import { registerTestPlanHandlers } from './test-plan.handlers'
import { registerTestCycleHandlers } from './test-cycle.handlers'
import { registerAssignmentHandlers } from './assignment.handlers'
import { registerReportHandlers } from './report.handlers'

export function registerAllHandlers(): void {
  registerProjectHandlers()
  registerCategoryHandlers()
  registerSubcategoryHandlers()
  registerTestCaseHandlers()
  registerTestPlanHandlers()
  registerTestCycleHandlers()
  registerAssignmentHandlers()
  registerReportHandlers()
}
```

- [ ] **Step 5: Commit**

```bash
git add src/main/ipc/category.handlers.ts src/main/ipc/subcategory.handlers.ts src/main/ipc/test-case.handlers.ts src/main/ipc/register-all.ts
git commit -m "feat: add category/subcategory IPC handlers, update test-case handler and register-all"
```

---

## Task 6: Preload Bridge

**Files:**
- Modify: `src/preload/index.ts`

The `index.d.ts` derives its types from `typeof api` in `index.ts`, so it needs no manual changes.

- [ ] **Step 1: Replace `folders` with `categories` + `subcategories`, update `testCases`**

Full file content for `src/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { IpcResult } from '@shared/types/ipc-result'
import { IpcError } from '@shared/types/ipc-result'

function unwrap<T>(result: IpcResult<T>): T {
  if (result.success) return result.data
  throw new IpcError(result.error.code, result.error.message)
}

const api = {
  projects: {
    getAll: async () => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.GET_ALL)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.DELETE, id))
  },
  categories: {
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.GET_BY_PROJECT, projectId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.CREATE, dto)),
    rename: async (id: number, name: string) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.RENAME, id, name)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.DELETE, id))
  },
  subcategories: {
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.GET_BY_PROJECT, projectId)),
    getByCategory: async (categoryId: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.GET_BY_CATEGORY, categoryId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.CREATE, dto)),
    rename: async (id: number, name: string) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.RENAME, id, name)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.DELETE, id))
  },
  testCases: {
    getBySubcategory: async (subcategoryId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_SUBCATEGORY, subcategoryId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.DELETE, id)),
    search: async (query: string, projectId?: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.SEARCH, query, projectId))
  },
  testPlans: {
    getAll: async () => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_ALL)),
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_BY_PROJECT, projectId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.DELETE, id))
  },
  testCycles: {
    getByPlan: async (planId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.GET_BY_PLAN, planId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.DELETE, id))
  },
  assignments: {
    getByCycle: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.GET_BY_CYCLE, cycleId)),
    assign: async (cycleId: number, testCaseIds: number[]) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.ASSIGN, cycleId, testCaseIds)),
    unassign: async (assignmentId: number) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.UNASSIGN, assignmentId)),
    updateStatus: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.UPDATE_STATUS, id, dto))
  },
  reports: {
    getData: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_DATA, cycleId)),
    getByCycle: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_BY_CYCLE, cycleId)),
    generate: async (cycleId: number, format: 'pdf' | 'html') => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GENERATE, cycleId, format))
  }
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
```

- [ ] **Step 2: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat: update preload bridge — replace folders with categories/subcategories"
```

---

## Task 7: CategoryPanel Component

**Files:**
- Create: `src/renderer/components/category-panel/CategoryPanel.tsx`
- Create: `src/renderer/components/category-panel/CategoryPanel.css`

- [ ] **Step 1: Create CategoryPanel.tsx**

Create `src/renderer/components/category-panel/CategoryPanel.tsx`:

```typescript
import React, { useState } from 'react'
import type { Category, Subcategory, CreateCategoryDTO, CreateSubcategoryDTO } from '@shared/types'
import { useApi } from '../../hooks/useApi'
import { useInvalidation } from '../../contexts/InvalidationContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useProject } from '../../contexts/ProjectContext'
import ConfirmDialog from '../shared/ConfirmDialog'
import './CategoryPanel.css'

interface Props {
  selectedSubcategory: Subcategory | null
  onSelectSubcategory: (sub: Subcategory | null) => void
}

export default function CategoryPanel({ selectedSubcategory, onSelectSubcategory }: Props) {
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const { selectedProject } = useProject()

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingSubIn, setCreatingSubIn] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null)
  const [renamingSubId, setRenamingSubId] = useState<number | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null)

  const { data: categories } = useApi<Category[]>(
    () => selectedProject
      ? window.api.categories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'categories'
  )

  const { data: subcategories } = useApi<Subcategory[]>(
    () => selectedProject
      ? window.api.subcategories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'subcategories'
  )

  const subsForCategory = (categoryId: number) =>
    (subcategories || []).filter((s) => s.category_id === categoryId)

  const toggleExpand = (id: number) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setExpandedIds(next)
  }

  const handleCreateCategory = async () => {
    if (!newName.trim() || !selectedProject) return
    try {
      const dto: CreateCategoryDTO = { name: newName.trim(), project_id: selectedProject.id }
      await window.api.categories.create(dto)
      invalidate('categories')
      notify('Category created', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setNewName('')
    setCreatingCategory(false)
  }

  const handleRenameCategory = async (id: number) => {
    if (!renameName.trim()) { setRenamingCategoryId(null); return }
    try {
      await window.api.categories.rename(id, renameName.trim())
      invalidate('categories')
      notify('Category renamed', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setRenamingCategoryId(null)
  }

  const handleDeleteCategory = async (cat: Category) => {
    try {
      await window.api.categories.delete(cat.id)
      invalidate('categories')
      invalidate('subcategories')
      invalidate('testCases')
      if (selectedSubcategory && subsForCategory(cat.id).some((s) => s.id === selectedSubcategory.id)) {
        onSelectSubcategory(null)
      }
      notify('Category deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeletingCategory(null)
  }

  const handleCreateSub = async (categoryId: number) => {
    if (!newName.trim() || !selectedProject) return
    try {
      const dto: CreateSubcategoryDTO = {
        name: newName.trim(),
        category_id: categoryId,
        project_id: selectedProject.id
      }
      const created = await window.api.subcategories.create(dto)
      invalidate('subcategories')
      onSelectSubcategory(created)
      notify('Sub-category created', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setNewName('')
    setCreatingSubIn(null)
  }

  const handleRenameSub = async (id: number) => {
    if (!renameName.trim()) { setRenamingSubId(null); return }
    try {
      await window.api.subcategories.rename(id, renameName.trim())
      invalidate('subcategories')
      notify('Sub-category renamed', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setRenamingSubId(null)
  }

  const handleDeleteSub = async (sub: Subcategory) => {
    try {
      await window.api.subcategories.delete(sub.id)
      invalidate('subcategories')
      invalidate('testCases')
      if (selectedSubcategory?.id === sub.id) onSelectSubcategory(null)
      notify('Sub-category deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeletingSub(null)
  }

  return (
    <div className="category-panel">
      <div className="category-panel-header">
        <span className="category-panel-label">Categories</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setCreatingCategory(true); setNewName('') }}
          disabled={!selectedProject}
        >+ New</button>
      </div>

      {creatingCategory && (
        <div className="category-create-input">
          <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCategory()
              if (e.key === 'Escape') setCreatingCategory(false)
            }}
            onBlur={() => { if (newName.trim()) handleCreateCategory(); else setCreatingCategory(false) }}
            placeholder="Category name..."
            autoFocus
          />
        </div>
      )}

      {(categories || []).length === 0 && !creatingCategory && (
        <div className="category-panel-empty">
          No categories yet.<br />Click <strong>+ New</strong> to create one.
        </div>
      )}

      {(categories || []).map((cat) => {
        const isExpanded = expandedIds.has(cat.id)
        const subs = subsForCategory(cat.id)

        return (
          <React.Fragment key={cat.id}>
            <div className="category-row">
              <span className="category-chevron" onClick={() => toggleExpand(cat.id)}>
                {isExpanded ? '▾' : '▸'}
              </span>

              {renamingCategoryId === cat.id ? (
                <input
                  className="input category-rename-input"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCategory(cat.id)
                    if (e.key === 'Escape') setRenamingCategoryId(null)
                  }}
                  onBlur={() => handleRenameCategory(cat.id)}
                  autoFocus
                />
              ) : (
                <span
                  className="category-name"
                  onClick={() => toggleExpand(cat.id)}
                  onDoubleClick={() => { setRenamingCategoryId(cat.id); setRenameName(cat.name) }}
                >
                  {cat.name}
                </span>
              )}

              <span className="category-actions">
                <button
                  className="category-action-btn"
                  title="New sub-category"
                  onClick={() => {
                    setCreatingSubIn(cat.id)
                    setNewName('')
                    if (!isExpanded) toggleExpand(cat.id)
                  }}
                >+</button>
                <button
                  className="category-action-btn danger"
                  title="Delete category"
                  onClick={() => setDeletingCategory(cat)}
                >×</button>
              </span>
            </div>

            {isExpanded && (
              <>
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`subcategory-row ${selectedSubcategory?.id === sub.id ? 'subcategory-row-selected' : ''}`}
                    onClick={() => onSelectSubcategory(sub)}
                  >
                    {renamingSubId === sub.id ? (
                      <input
                        className="input subcategory-rename-input"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSub(sub.id)
                          if (e.key === 'Escape') setRenamingSubId(null)
                        }}
                        onBlur={() => handleRenameSub(sub.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="subcategory-name"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setRenamingSubId(sub.id)
                          setRenameName(sub.name)
                        }}
                      >
                        {sub.name}
                      </span>
                    )}
                    <span className="subcategory-actions">
                      <button
                        className="category-action-btn danger"
                        title="Delete sub-category"
                        onClick={(e) => { e.stopPropagation(); setDeletingSub(sub) }}
                      >×</button>
                    </span>
                  </div>
                ))}

                {creatingSubIn === cat.id && (
                  <div className="subcategory-create-input">
                    <input
                      className="input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSub(cat.id)
                        if (e.key === 'Escape') setCreatingSubIn(null)
                      }}
                      onBlur={() => { if (newName.trim()) handleCreateSub(cat.id); else setCreatingSubIn(null) }}
                      placeholder="Sub-category name..."
                      autoFocus
                    />
                  </div>
                )}
              </>
            )}
          </React.Fragment>
        )
      })}

      {deletingCategory && (
        <ConfirmDialog
          title="Delete Category"
          message={`Delete "${deletingCategory.name}" and all its sub-categories and test cases? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteCategory(deletingCategory)}
          onCancel={() => setDeletingCategory(null)}
        />
      )}

      {deletingSub && (
        <ConfirmDialog
          title="Delete Sub-category"
          message={`Delete "${deletingSub.name}" and all its test cases? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteSub(deletingSub)}
          onCancel={() => setDeletingSub(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create CategoryPanel.css**

Create `src/renderer/components/category-panel/CategoryPanel.css`:

```css
/* === Category Panel === */

.category-panel {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.category-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-1);
  margin-bottom: var(--sp-3);
}

.category-panel-label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--on-surface-variant);
}

.category-panel-empty {
  padding: var(--sp-6) var(--sp-2);
  text-align: center;
  font-size: 0.8125rem;
  color: var(--on-surface-variant);
  line-height: 1.6;
  opacity: 0.6;
}

/* Category row */
.category-row {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 5px var(--sp-2);
  border-radius: var(--radius-default);
  cursor: pointer;
  min-height: 32px;
  position: relative;
}

.category-row:hover {
  background: rgba(59, 130, 246, 0.05);
}

.category-chevron {
  width: 20px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: var(--on-surface-variant);
  cursor: pointer;
  user-select: none;
  border-radius: 3px;
  transition: background 0.1s;
  flex-shrink: 0;
}

.category-chevron:hover {
  background: rgba(59, 130, 246, 0.1);
}

.category-name {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--on-surface);
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Category action buttons (shown on hover) */
.category-actions,
.subcategory-actions {
  display: none;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.category-row:hover .category-actions,
.subcategory-row:hover .subcategory-actions {
  display: flex;
}

.category-action-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 3px;
  font-size: 1rem;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  line-height: 1;
}

.category-action-btn:hover {
  background: rgba(59, 130, 246, 0.12);
  color: var(--primary);
}

.category-action-btn.danger:hover {
  background: rgba(248, 113, 113, 0.12);
  color: var(--critical);
}

/* Sub-category row */
.subcategory-row {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  padding: 4px var(--sp-2) 4px 36px;
  border-radius: var(--radius-default);
  cursor: pointer;
  min-height: 28px;
  transition: background 0.1s;
  position: relative;
}

.subcategory-row:hover {
  background: rgba(59, 130, 246, 0.06);
}

.subcategory-row-selected {
  background: rgba(59, 130, 246, 0.1);
}

.subcategory-row-selected .subcategory-name {
  color: var(--primary);
  font-weight: 600;
}

.subcategory-name {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--on-surface);
  user-select: none;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.1s;
}

/* Inline rename inputs */
.category-rename-input,
.subcategory-rename-input {
  flex: 1;
  padding: 2px 6px !important;
  font-size: 0.8125rem !important;
  height: 24px !important;
  border-radius: var(--radius-sm) !important;
}

/* Inline create inputs */
.category-create-input {
  padding: 3px var(--sp-2);
}

.subcategory-create-input {
  padding: 3px var(--sp-2) 3px 36px;
}

.category-create-input .input,
.subcategory-create-input .input {
  padding: 4px 8px;
  font-size: 0.8125rem;
  height: 28px;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/components/category-panel/CategoryPanel.tsx src/renderer/components/category-panel/CategoryPanel.css
git commit -m "feat: add CategoryPanel component replacing FolderTree"
```

---

## Task 8: TestLibraryPage + TestCaseList + TestCaseForm

**Files:**
- Modify: `src/renderer/pages/TestLibraryPage.tsx`
- Modify: `src/renderer/components/test-cases/TestCaseList.tsx`
- Modify: `src/renderer/components/test-cases/TestCaseForm.tsx`

- [ ] **Step 1: Update TestLibraryPage.tsx**

Full file content:

```typescript
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CategoryPanel from '../components/category-panel/CategoryPanel'
import TestCaseList from '../components/test-cases/TestCaseList'
import TestCaseForm from '../components/test-cases/TestCaseForm'
import type { Subcategory, TestCase, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import { useProject } from '../contexts/ProjectContext'
import './TestLibraryPage.css'

export default function TestLibraryPage() {
  const navigate = useNavigate()
  const { selectedProject } = useProject()
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()

  const { data: testCases, loading } = useApi<TestCase[]>(
    () => selectedSubcategory
      ? window.api.testCases.getBySubcategory(selectedSubcategory.id)
      : Promise.resolve([]),
    [selectedSubcategory?.id],
    'testCases'
  )

  const handleCreateCase = async (dto: CreateTestCaseDTO) => {
    try {
      await window.api.testCases.create(dto)
      invalidate('testCases')
      notify('Test case created', 'success')
      setShowForm(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleUpdateCase = async (id: number, dto: UpdateTestCaseDTO) => {
    try {
      await window.api.testCases.update(id, dto)
      invalidate('testCases')
      notify('Test case updated', 'success')
      setShowForm(false)
      setEditingCase(null)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleDeleteCase = async (id: number) => {
    try {
      await window.api.testCases.delete(id)
      invalidate('testCases')
      notify('Test case deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  if (!selectedProject) return (
    <div className="no-project-guard">
      <p className="no-project-guard-title">No project selected</p>
      <p className="no-project-guard-desc">Select a project to manage its test library.</p>
      <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
    </div>
  )

  return (
    <div className="library-page">
      <div className="library-header">
        <h1 className="headline-sm">Test Library</h1>
      </div>
      <div className="library-content">
        <div className="library-tree-panel">
          <CategoryPanel
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={setSelectedSubcategory}
          />
        </div>
        <div className="library-cases-panel">
          <TestCaseList
            subcategory={selectedSubcategory}
            testCases={testCases || []}
            loading={loading}
            onNewCase={() => { setEditingCase(null); setShowForm(true) }}
            onEditCase={(tc) => { setEditingCase(tc); setShowForm(true) }}
            onDeleteCase={handleDeleteCase}
          />
        </div>
      </div>

      {showForm && selectedSubcategory && (
        <TestCaseForm
          subcategoryId={selectedSubcategory.id}
          testCase={editingCase}
          onSave={(dto) =>
            editingCase
              ? handleUpdateCase(editingCase.id, dto as UpdateTestCaseDTO)
              : handleCreateCase(dto as CreateTestCaseDTO)
          }
          onCancel={() => { setShowForm(false); setEditingCase(null) }}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update TestCaseList.tsx**

Change the `folder` prop to `subcategory`. Full file content:

```typescript
import React, { useState } from 'react'
import type { Subcategory, TestCase } from '@shared/types'
import ConfirmDialog from '../shared/ConfirmDialog'
import './TestCaseList.css'

interface Props {
  subcategory: Subcategory | null
  testCases: TestCase[]
  loading: boolean
  onNewCase: () => void
  onEditCase: (tc: TestCase) => void
  onDeleteCase: (id: number) => void
}

function NoSubcategoryState() {
  return (
    <div className="tcl-empty-state">
      <svg className="tcl-empty-illustration" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="38" width="112" height="76" rx="7" fill="#e8edf5"/>
        <rect x="24" y="38" width="112" height="22" rx="7" fill="#c8d4e8"/>
        <rect x="24" y="52" width="112" height="8" rx="0" fill="#c8d4e8"/>
        <rect x="36" y="44" width="40" height="5" rx="2.5" fill="#98afc8"/>
        <circle cx="124" cy="47" r="6" fill="#98afc8" opacity="0.45"/>
        <rect x="36" y="74" width="88" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="36" y="88" width="64" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="36" y="102" width="76" height="5" rx="2.5" fill="#d0daea"/>
      </svg>
      <p className="tcl-empty-title">Select a sub-category</p>
      <p className="tcl-empty-desc">Choose a sub-category from the left panel to view and manage its test cases.</p>
    </div>
  )
}

function NoTestCasesState({ subName, onNewCase }: { subName: string; onNewCase: () => void }) {
  return (
    <div className="tcl-empty-state">
      <svg className="tcl-empty-illustration" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="26" width="76" height="88" rx="6" fill="#e8edf5"/>
        <rect x="22" y="26" width="76" height="20" rx="6" fill="#c8d4e8"/>
        <rect x="22" y="38" width="76" height="8" rx="0" fill="#c8d4e8"/>
        <path d="M34 35 h28" stroke="#98afc8" strokeWidth="3" strokeLinecap="round"/>
        <rect x="34" y="58" width="52" height="4" rx="2" fill="#d0daea"/>
        <rect x="34" y="70" width="38" height="4" rx="2" fill="#d0daea"/>
        <rect x="34" y="82" width="46" height="4" rx="2" fill="#d0daea"/>
        <rect x="34" y="94" width="30" height="4" rx="2" fill="#d0daea"/>
        <circle cx="118" cy="92" r="24" fill="#f0f4fc"/>
        <circle cx="116" cy="90" r="13" fill="none" stroke="#a0b4d0" strokeWidth="2.5"/>
        <line x1="125" y1="99" x2="136" y2="110" stroke="#a0b4d0" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <p className="tcl-empty-title">No test cases</p>
      <p className="tcl-empty-desc">
        No test cases in &ldquo;{subName}&rdquo; yet. Create your first one to get started.
      </p>
      <button className="btn btn-primary btn-sm" onClick={onNewCase}>+ New Test Case</button>
    </div>
  )
}

export default function TestCaseList({ subcategory, testCases, loading, onNewCase, onEditCase, onDeleteCase }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null)

  if (!subcategory) {
    return <NoSubcategoryState />
  }

  return (
    <div className="test-case-list">
      <div className="test-case-list-header">
        <div className="tcl-title-row">
          <div>
            <h2 className="tcl-folder-name">{subcategory.name}</h2>
            <span className="tcl-count">
              {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onNewCase}>+ New Test Case</button>
        </div>
      </div>

      {loading ? (
        <div className="tcl-loading">Loading…</div>
      ) : testCases.length === 0 ? (
        <NoTestCasesState subName={subcategory.name} onNewCase={onNewCase} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 110 }}>ID</th>
              <th style={{ width: 80 }}>Version</th>
              <th>Title</th>
              <th style={{ width: 80 }}>Steps</th>
              <th style={{ width: 100 }}>Created</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.id} className="cursor-pointer" onClick={() => onEditCase(tc)}>
                <td>
                  <span className="tcl-id">{tc.display_id || '—'}</span>
                </td>
                <td className="secondary">{tc.version || '—'}</td>
                <td>{tc.title}</td>
                <td className="secondary">{tc.steps.length} step{tc.steps.length !== 1 ? 's' : ''}</td>
                <td className="secondary">{new Date(tc.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(tc) }}
                    title="Delete"
                  >×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Test Case"
          message={`Delete "${deleteTarget.title}"? This will also remove it from any assigned test cycles.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDeleteCase(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Update TestCaseForm.tsx**

Change `folderId` prop to `subcategoryId`, update the DTO. Full file content:

```typescript
import React, { useState } from 'react'
import type { TestCase, TestStep, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import './TestCaseForm.css'

interface Props {
  subcategoryId: number
  testCase: TestCase | null
  onSave: (dto: CreateTestCaseDTO | UpdateTestCaseDTO) => void
  onCancel: () => void
}

export default function TestCaseForm({ subcategoryId, testCase, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(testCase?.title || '')
  const [description, setDescription] = useState(testCase?.description || '')
  const [version, setVersion] = useState(testCase?.version || '')
  const [expectedResult, setExpectedResult] = useState(testCase?.expected_result || '')
  const [steps, setSteps] = useState<TestStep[]>(
    testCase?.steps?.length
      ? testCase.steps
      : [{ step: 1, action: '', expected: '' }]
  )

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, action: '', expected: '' }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 })))
  }

  const updateStep = (index: number, field: 'action' | 'expected', value: string) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    const dto = {
      title: title.trim(),
      description: description.trim(),
      steps: steps.filter((s) => s.action.trim()),
      expected_result: expectedResult.trim(),
      version: version.trim(),
      subcategory_id: subcategoryId
    }
    onSave(dto)
  }

  return (
    <div className="tcf-overlay" onClick={onCancel}>
      <div className="tcf-modal" onClick={(e) => e.stopPropagation()}>

        <h2 className="tcf-title">{testCase ? 'Edit Test Case' : 'New Test Case'}</h2>

        <div className="tcf-field">
          <label className="tcf-label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Login with valid credentials"
            autoFocus
          />
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Version</label>
          <input
            className="input"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 1.0.0"
          />
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Description</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this test case verifies..."
            rows={2}
          />
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Steps</label>
          <div className="tcf-steps">
            <div className="tcf-steps-head">
              <span className="tcf-col-num">#</span>
              <span className="tcf-col-action">ACTION</span>
              <span className="tcf-col-expected">EXPECTED RESULT</span>
              <span className="tcf-col-del" />
            </div>
            {steps.map((step, i) => (
              <div key={i} className="tcf-step-row">
                <span className="tcf-col-num mono">{step.step}</span>
                <input
                  className="input tcf-step-input"
                  value={step.action}
                  onChange={(e) => updateStep(i, 'action', e.target.value)}
                  placeholder="Action..."
                />
                <input
                  className="input tcf-step-input"
                  value={step.expected}
                  onChange={(e) => updateStep(i, 'expected', e.target.value)}
                  placeholder="Expected..."
                />
                <button
                  className="tcf-del-btn"
                  onClick={() => removeStep(i)}
                  disabled={steps.length <= 1}
                  title="Remove step"
                >×</button>
              </div>
            ))}
            <button className="tcf-add-step" onClick={addStep}>+ Add Step</button>
          </div>
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Overall Expected Result</label>
          <textarea
            className="textarea"
            value={expectedResult}
            onChange={(e) => setExpectedResult(e.target.value)}
            placeholder="The overall expected outcome..."
            rows={2}
          />
        </div>

        <div className="tcf-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!title.trim()}>
            {testCase ? 'Save Changes' : 'Create Test Case'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/pages/TestLibraryPage.tsx src/renderer/components/test-cases/TestCaseList.tsx src/renderer/components/test-cases/TestCaseForm.tsx
git commit -m "feat: update TestLibraryPage, TestCaseList, TestCaseForm to use subcategory"
```

---

## Task 9: TestCycleDetailPage + AssignmentPicker

**Files:**
- Modify: `src/renderer/pages/TestCycleDetailPage.tsx`
- Modify: `src/renderer/components/execution/AssignmentPicker.tsx`

- [ ] **Step 1: Update TestCycleDetailPage.tsx**

Change the `Folder` column header and the cell value. Locate the table section (lines 139–159) and replace:

```typescript
// OLD:
<th>Folder</th>
// ...
<td className="secondary">{a.folder_path}</td>

// NEW:
<th>Category / Sub-category</th>
// ...
<td className="secondary">{a.category_name} / {a.subcategory_name}</td>
```

Full updated table section in context (replace the `<table>` block starting at line 139):

```typescript
          <table className="data-table">
            <thead>
              <tr>
                <th>Category / Sub-category</th>
                <th>Test Case</th>
                <th>Status</th>
                <th>Bug Ref</th>
              </tr>
            </thead>
            <tbody>
              {assignments!.map((a) => (
                <tr key={a.id}>
                  <td className="secondary">{a.category_name} / {a.subcategory_name}</td>
                  <td>{a.test_case_title}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="mono">{a.bug_ref || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
```

- [ ] **Step 2: Update AssignmentPicker.tsx**

Replace the folder-based left panel with a two-level category/subcategory panel. Full file content:

```typescript
import React, { useState } from 'react'
import type { Category, Subcategory, TestCase, TestCaseAssignment } from '@shared/types'
import { useApi } from '../../hooks/useApi'
import { useProject } from '../../contexts/ProjectContext'
import './AssignmentPicker.css'

interface Props {
  cycleId: number
  existingAssignments: TestCaseAssignment[]
  onAssign: (testCaseIds: number[]) => void
  onClose: () => void
}

export default function AssignmentPicker({ cycleId, existingAssignments, onAssign, onClose }: Props) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { selectedProject } = useProject()

  const assignedIds = new Set(existingAssignments.map((a) => a.test_case_id))

  const { data: categories } = useApi<Category[]>(
    () => selectedProject
      ? window.api.categories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'categories'
  )

  const { data: subcategories } = useApi<Subcategory[]>(
    () => selectedProject
      ? window.api.subcategories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'subcategories'
  )

  const { data: testCases } = useApi<TestCase[]>(
    () => selectedSubcategory
      ? window.api.testCases.getBySubcategory(selectedSubcategory.id)
      : Promise.resolve([]),
    [selectedSubcategory?.id]
  )

  const subsForCategory = (categoryId: number) =>
    (subcategories || []).filter((s) => s.category_id === categoryId)

  const toggleCase = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Test Cases</h2>
        </div>

        <div className="picker-layout">
          <div className="picker-folders">
            <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>Categories</div>
            {(categories || []).length === 0 ? (
              <div className="body-sm text-muted">No categories</div>
            ) : (
              (categories || []).map((cat) => (
                <React.Fragment key={cat.id}>
                  <div className="picker-category-header">{cat.name}</div>
                  {subsForCategory(cat.id).map((sub) => (
                    <div
                      key={sub.id}
                      className={`picker-folder picker-subfolder ${selectedSubcategory?.id === sub.id ? 'picker-folder-active' : ''}`}
                      onClick={() => setSelectedSubcategory(sub)}
                    >
                      {sub.name}
                    </div>
                  ))}
                </React.Fragment>
              ))
            )}
          </div>

          <div className="picker-cases">
            <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>
              Test Cases {selectedSubcategory ? `in ${selectedSubcategory.name}` : ''}
            </div>
            {!selectedSubcategory ? (
              <div className="body-sm text-muted">Select a sub-category</div>
            ) : !testCases?.length ? (
              <div className="body-sm text-muted">No test cases in this sub-category</div>
            ) : (
              <div className="picker-case-list">
                {testCases.map((tc) => {
                  const isAssigned = assignedIds.has(tc.id)
                  const isSelected = selected.has(tc.id)
                  return (
                    <label
                      key={tc.id}
                      className={`picker-case-item ${isAssigned ? 'picker-case-assigned' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected || isAssigned}
                        disabled={isAssigned}
                        onChange={() => toggleCase(tc.id)}
                      />
                      <span>{tc.title}</span>
                      {isAssigned && <span className="body-sm text-muted">(assigned)</span>}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <span className="body-sm text-muted">{selected.size} selected</span>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onAssign(Array.from(selected))} disabled={selected.size === 0}>
            Assign Selected
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add picker-category-header + picker-subfolder styles to AssignmentPicker.css**

Open `src/renderer/components/execution/AssignmentPicker.css` and append:

```css
.picker-category-header {
  padding: 6px 8px 3px;
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--on-surface-variant);
  opacity: 0.7;
}

.picker-subfolder {
  padding-left: 20px;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/pages/TestCycleDetailPage.tsx src/renderer/components/execution/AssignmentPicker.tsx src/renderer/components/execution/AssignmentPicker.css
git commit -m "feat: update TestCycleDetailPage and AssignmentPicker to use category/subcategory"
```

---

## Task 10: Delete Old Files + Final Verification

**Files to delete:**
- `src/shared/types/folder.ts`
- `src/main/database/repositories/folder.repo.ts`
- `src/main/ipc/folder.handlers.ts`
- `src/renderer/components/folder-tree/FolderTree.tsx`
- `src/renderer/components/folder-tree/FolderNode.tsx`
- `src/renderer/components/folder-tree/FolderTree.css`

- [ ] **Step 1: Delete old files**

```bash
rm src/shared/types/folder.ts
rm src/main/database/repositories/folder.repo.ts
rm src/main/ipc/folder.handlers.ts
rm src/renderer/components/folder-tree/FolderTree.tsx
rm src/renderer/components/folder-tree/FolderNode.tsx
rm src/renderer/components/folder-tree/FolderTree.css
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. If there are errors, they will point to any remaining references to `Folder`, `folder_id`, `folders`, or `getByFolder` — fix them before proceeding.

- [ ] **Step 3: Start the app and test manually**

```bash
npm run dev
```

Manual test checklist:
1. App starts without console errors
2. Navigate to Test Library — left panel shows "Categories" header with "+ New" button
3. Create a Main Category — appears in list
4. Click "+" on the category row — inline input appears for sub-category
5. Create a Sub-category — appears indented under the category
6. Click the Sub-category — test case list on the right activates with "+ New Test Case" button
7. Create a test case — appears in the table with a display ID like `XXX-TC001`
8. Edit a test case — form opens pre-filled, save updates the row
9. Delete a test case — row disappears
10. Delete a Sub-category — confirm dialog appears, sub-category and its test cases are removed
11. Delete a Category — confirm dialog warns about all sub-categories, cascades correctly
12. Navigate to a Test Cycle — "Assign Cases" picker shows categories with indented sub-categories
13. Assign test cases from a sub-category — they appear in the cycle table under "Category / Sub-category" column
14. Rename a category (double-click) — name updates
15. Rename a sub-category (double-click) — name updates

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: delete old folder tree files, complete category/subcategory restructure"
```
