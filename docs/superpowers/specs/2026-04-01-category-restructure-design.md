# Category Restructure Design

**Date:** 2026-04-01  
**Status:** Approved  
**Topic:** Replace unlimited-depth folder tree with a strict 2-level category/sub-category structure

---

## Summary

The current `folder` table supports unlimited nesting depth via a recursive `parent_id`. This is being replaced with a strict 2-level system:

- **Main Category** — grouping container only, cannot hold test cases directly
- **Sub-category** — holds test cases; always belongs to exactly one Main Category

Test cases can only be assigned to sub-categories. Main categories are structural containers.

Existing folder and test case data is wiped (acceptable — early-stage development).

---

## 1. Database Schema

**Migration:** `src/main/database/migrations/004-restructure-categories.ts`

Drop old tables and recreate clean. `test_case_assignment` references `test_case.id`, so it must be dropped first to avoid FK issues, then recreated unchanged:

```sql
-- Drop in dependency order
DROP TABLE IF EXISTS test_case_assignment;
DROP TABLE IF EXISTS test_case;
DROP TABLE IF EXISTS folder;

CREATE TABLE category (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_category_project ON category(project_id);

CREATE TABLE subcategory (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_subcategory_category ON subcategory(category_id);

CREATE TABLE test_case (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  display_id      TEXT,
  title           TEXT    NOT NULL,
  description     TEXT    NOT NULL DEFAULT '',
  steps           TEXT    NOT NULL DEFAULT '[]',
  expected_result TEXT    NOT NULL DEFAULT '',
  version         TEXT    NOT NULL DEFAULT '',
  subcategory_id  INTEGER NOT NULL REFERENCES subcategory(id) ON DELETE CASCADE,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_test_case_subcategory ON test_case(subcategory_id);

-- Recreate test_case_assignment (same structure as migration 001, references new test_case)
CREATE TABLE test_case_assignment (
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
CREATE INDEX idx_assignment_cycle ON test_case_assignment(test_cycle_id);
CREATE INDEX idx_assignment_test_case ON test_case_assignment(test_case_id);
```

**display_id generation path:** `subcategory → category → project.code` → produces `{PROJECT_CODE}-TC{N}` (same format, different join chain).

---

## 2. Shared Types

**Remove:** `src/shared/types/folder.ts`

**Add:** `src/shared/types/category.ts`
```typescript
export interface Category {
  id: number
  name: string
  project_id: number
  created_at: string
  updated_at: string
}
export interface CreateCategoryDTO { name: string; project_id: number }
export interface UpdateCategoryDTO { name?: string }
```

**Add:** `src/shared/types/subcategory.ts`
```typescript
export interface Subcategory {
  id: number
  name: string
  category_id: number
  project_id: number
  created_at: string
  updated_at: string
}
export interface CreateSubcategoryDTO { name: string; category_id: number; project_id: number }
export interface UpdateSubcategoryDTO { name?: string }
```

**Update:** `src/shared/types/test-case.ts`
- `folder_id: number` → `subcategory_id: number` (on `TestCase`, `CreateTestCaseDTO`, `UpdateTestCaseDTO`)

**Update:** `src/shared/types/assignment.ts`
- Remove `folder_path: string` from `TestCaseAssignment`
- Add `category_name: string` and `subcategory_name: string`

**Update:** `src/shared/types/index.ts`
- Remove Folder exports, add Category + Subcategory exports

---

## 3. Backend — Repositories & IPC

### Repositories

**Remove:** `src/main/database/repositories/folder.repo.ts`

**Add:** `src/main/database/repositories/category.repo.ts`
- `getByProject(projectId: number): Category[]`
- `getById(id: number): Category | undefined`
- `create(dto: CreateCategoryDTO): Category`
- `rename(id: number, name: string): Category`
- `delete(id: number): void` — cascades to subcategories and their test cases

**Add:** `src/main/database/repositories/subcategory.repo.ts`
- `getByCategory(categoryId: number): Subcategory[]`
- `getById(id: number): Subcategory | undefined`
- `create(dto: CreateSubcategoryDTO): Subcategory`
- `rename(id: number, name: string): Subcategory`
- `delete(id: number): void` — cascades to test cases

**Update:** `src/main/database/repositories/test-case.repo.ts`
- All queries: `folder_id` → `subcategory_id`, `folder` table → `subcategory` table
- `display_id` generation: join chain `subcategory → category → project` to get `project.code`

**Update:** `src/main/database/repositories/assignment.repo.ts`
- Replace join on `folder` for `folder_path` with joins on `subcategory` and `category` to produce `category_name` and `subcategory_name`

### IPC Channels

**Update:** `src/shared/ipc-channels.ts`
- Remove `folder:*` channels
- Add `category:getByProject`, `category:create`, `category:rename`, `category:delete`
- Add `subcategory:getByCategory`, `subcategory:create`, `subcategory:rename`, `subcategory:delete`

### IPC Handlers

**Remove:** `src/main/ipc/folder.handlers.ts`

**Add:** `src/main/ipc/category.handlers.ts` — registers category CRUD handlers

**Add:** `src/main/ipc/subcategory.handlers.ts` — registers subcategory CRUD handlers

**Update:** `src/main/ipc/register-all.ts` — remove folder, add category + subcategory

### Preload Bridge

**Update:** `src/preload/index.ts` and `src/preload/index.d.ts`
- Remove `folders` namespace
- Add `categories` namespace: `getByProject`, `create`, `rename`, `delete`
- Add `subcategories` namespace: `getByCategory`, `create`, `rename`, `delete`

---

## 4. UI — Components & Pages

### Remove
- `src/renderer/components/folder-tree/FolderTree.tsx`
- `src/renderer/components/folder-tree/FolderNode.tsx`
- `src/renderer/components/folder-tree/FolderTree.css`

### Add — CategoryPanel

**Location:** `src/renderer/components/category-panel/`
**Files:** `CategoryPanel.tsx`, `CategoryPanel.css`

**Behaviour:**
- Flat list of Main Categories, each with a collapse/expand chevron
- Sub-categories appear indented under their parent Main Category
- Clicking a Sub-category selects it → triggers `onSelectSubcategory(sub)`
- "**+ New Category**" button at the top → inline input to create a Main Category
- "**+ New Sub-category**" button on each Main Category row → inline input appears under it
- Both levels support rename (double-click or dedicated button) and delete (with confirm dialog)
- Deleting a Main Category deletes all its Sub-categories and their test cases (cascade, user warned)

**Props:**
```typescript
interface Props {
  selectedSubcategory: Subcategory | null
  onSelectSubcategory: (sub: Subcategory) => void
}
```

### Update — TestLibraryPage

- Replace `FolderTree` + `selectedFolder: Folder | null` state with `CategoryPanel` + `selectedSubcategory: Subcategory | null`
- Pass `selectedSubcategory` to `TestCaseList` and `TestCaseForm`

### Update — TestCaseList

- Prop: `folder: Folder | null` → `subcategory: Subcategory | null`
- Empty state copy: "Select a folder" → "Select a sub-category"
- Header: shows sub-category name

### Update — TestCaseForm

- Internal state + DTO: `folder_id` → `subcategory_id`

### Update — TestCycleDetailPage

- Table column header: `Folder` → `Category / Sub-category`
- Cell value: `a.folder_path` → `{a.category_name} / {a.subcategory_name}`

### Update — AssignmentPicker

- Replace folder tree filter with a two-level filter:
  1. Select a Main Category (dropdown or list)
  2. Sub-categories for that category appear
  3. Test cases for the selected sub-category are listed for assignment

---

## Files Changed / Added Summary

| Action | File |
|--------|------|
| Add | `src/main/database/migrations/004-restructure-categories.ts` |
| Remove | `src/main/database/repositories/folder.repo.ts` |
| Add | `src/main/database/repositories/category.repo.ts` |
| Add | `src/main/database/repositories/subcategory.repo.ts` |
| Update | `src/main/database/repositories/test-case.repo.ts` |
| Update | `src/main/database/repositories/assignment.repo.ts` |
| Update | `src/main/database/connection.ts` (run new migration) |
| Remove | `src/main/ipc/folder.handlers.ts` |
| Add | `src/main/ipc/category.handlers.ts` |
| Add | `src/main/ipc/subcategory.handlers.ts` |
| Update | `src/main/ipc/register-all.ts` |
| Update | `src/shared/ipc-channels.ts` |
| Remove | `src/shared/types/folder.ts` |
| Add | `src/shared/types/category.ts` |
| Add | `src/shared/types/subcategory.ts` |
| Update | `src/shared/types/test-case.ts` |
| Update | `src/shared/types/assignment.ts` |
| Update | `src/shared/types/index.ts` |
| Update | `src/preload/index.ts` |
| Update | `src/preload/index.d.ts` |
| Remove | `src/renderer/components/folder-tree/FolderTree.tsx` |
| Remove | `src/renderer/components/folder-tree/FolderNode.tsx` |
| Remove | `src/renderer/components/folder-tree/FolderTree.css` |
| Add | `src/renderer/components/category-panel/CategoryPanel.tsx` |
| Add | `src/renderer/components/category-panel/CategoryPanel.css` |
| Update | `src/renderer/pages/TestLibraryPage.tsx` (and its CSS if needed) |
| Update | `src/renderer/components/test-cases/TestCaseList.tsx` |
| Update | `src/renderer/components/test-cases/TestCaseForm.tsx` |
| Update | `src/renderer/pages/TestCycleDetailPage.tsx` |
| Update | `src/renderer/components/execution/AssignmentPicker.tsx` |
