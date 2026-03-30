# QA Workspace Management App - Implementation Plan

**Created:** 2026-03-30
**Status:** DRAFT - Awaiting confirmation
**Complexity:** HIGH (greenfield Electron + React + SQLite desktop app)

---

## RALPLAN-DR Summary

### Guiding Principles

1. **Offline-first, zero-config** -- The app must work immediately after install with no server, no auth, no network. SQLite is the single source of truth.
2. **Data integrity over speed** -- Foreign key constraints, cascading deletes, and transactional writes protect user data. No eventual consistency concerns.
3. **Separation of concerns via IPC boundary** -- All database access lives in the Electron main process. The renderer never touches SQLite directly. This enforces a clean API layer and prevents Electron security pitfalls.
4. **Incremental delivery** -- Each phase produces a working, testable vertical slice. Phase 1 is usable on its own; each subsequent phase adds a feature domain.
5. **Minimal dependency surface** -- Prefer built-in Electron APIs (printToPDF, dialog) and lightweight libraries over heavy frameworks. Fewer deps = fewer upgrade headaches.

### Decision Drivers (Top 3)

1. **IPC architecture** -- How main and renderer communicate determines testability, security, and developer ergonomics for the entire app.
2. **State management in renderer** -- Determines complexity of data flow across 6+ interconnected views (folders, test cases, plans, cycles, execution, reports).
3. **Build tooling** -- Affects developer iteration speed, bundle size, and packaging for distribution.

### Viable Options

#### Option A: contextBridge + preload (Recommended)

Expose a typed `window.api` object via `contextBridge.exposeInMainWorld` in a preload script. Each domain (folders, testCases, testPlans, testCycles, assignments, reports) gets a namespace of async methods. Renderer calls `window.api.testCases.getAll(folderId)` which internally uses `ipcRenderer.invoke`.

| Pros | Cons |
|------|------|
| Security: renderer has no access to Node or ipcRenderer directly | Slightly more boilerplate per IPC channel |
| Fully typed end-to-end with shared TypeScript interfaces | Preload script must be maintained alongside main handlers |
| Electron best practice since contextIsolation default | N/A |
| Easy to unit test: mock `window.api` in renderer tests | N/A |

#### Option B: Direct ipcRenderer in renderer (with nodeIntegration)

Enable `nodeIntegration: true` and use `ipcRenderer.invoke` directly in React components or hooks.

| Pros | Cons |
|------|------|
| Less boilerplate, no preload needed | Security anti-pattern: full Node access in renderer |
| Slightly faster to prototype | Harder to test: must mock electron module |
| N/A | Electron docs explicitly discourage this |
| N/A | Cannot use with contextIsolation (the default) |

**Recommendation:** Option A (contextBridge + preload). It is the Electron-recommended pattern, provides type safety, and keeps the renderer sandboxed. The additional boilerplate is a one-time cost per domain and is offset by easier testing.

#### State Management: React Context + useReducer (Recommended over Redux/Zustand)

For an offline-first app where the database is the source of truth, heavy client-side state management adds complexity without benefit. Each view fetches from SQLite via IPC on mount. Local component state and a thin React Context for cross-cutting concerns (active plan, active cycle, sidebar selection) is sufficient.

| Option | Pros | Cons |
|--------|------|------|
| React Context + useReducer | Simple, no deps, DB is source of truth | Must manually invalidate/refetch on writes |
| Zustand | Lightweight, good DX | Extra dependency for little benefit when DB is truth |
| Redux Toolkit | Mature ecosystem | Heavy for a local-first app with no async server state |

**Recommendation:** React Context + useReducer + custom hooks that wrap IPC calls with loading/error states.

#### Build Tooling: Vite + electron-vite (Recommended)

| Option | Pros | Cons |
|--------|------|------|
| electron-vite | Fast HMR, first-class Electron support, handles main/preload/renderer builds | Younger ecosystem |
| Webpack (electron-forge) | Mature, lots of examples | Slower builds, more config |

**Recommendation:** electron-vite for fast iteration with minimal configuration.

---

## ADR: Architecture Decision Record

**Decision:** Use contextBridge + typed preload for IPC, React Context + useReducer for state, electron-vite for builds, better-sqlite3 for storage.

**Drivers:**
- Security (sandboxed renderer)
- Developer ergonomics (typed IPC, fast HMR)
- Simplicity (DB as source of truth, minimal state management)

**Alternatives Considered:**
- Direct ipcRenderer with nodeIntegration -- rejected for security reasons
- Redux/Zustand -- rejected as over-engineering for a local-first app
- Webpack via electron-forge -- rejected for slower DX

**Why Chosen:** This combination provides the best balance of security, simplicity, and developer speed. The contextBridge pattern is Electron's official recommendation. React Context avoids unnecessary abstraction when SQLite is always the authority. electron-vite gives sub-second HMR.

**Consequences:**
- Every new IPC channel requires additions in three places: main handler, preload exposure, shared type. This is manageable with a consistent pattern but requires discipline.
- No offline caching layer in renderer -- every navigation triggers an IPC fetch. Acceptable for local SQLite (sub-millisecond reads).

**Follow-ups:**
- Evaluate electron-builder vs electron-forge for packaging/distribution in a future plan.
- Consider adding a lightweight query cache (SWR-pattern) if performance profiling reveals IPC overhead on large datasets (1000+ test cases).

---

## Project Structure

```
qa-workspace-app/
├── electron.vite.config.ts
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.web.json
├── resources/                    # App icons, static assets for packaging
│   └── icon.png
├── src/
│   ├── shared/                   # Shared between main and renderer
│   │   ├── types/
│   │   │   ├── index.ts          # Re-exports
│   │   │   ├── folder.ts         # Folder, CreateFolderDTO, UpdateFolderDTO
│   │   │   ├── test-case.ts      # TestCase, CreateTestCaseDTO, UpdateTestCaseDTO
│   │   │   ├── test-plan.ts      # TestPlan, CreateTestPlanDTO
│   │   │   ├── test-cycle.ts     # TestCycle, CreateTestCycleDTO
│   │   │   ├── assignment.ts     # TestCaseAssignment, ExecutionStatus
│   │   │   └── report.ts         # ReportData, ReportFormat
│   │   └── ipc-channels.ts       # String constants for all IPC channel names
│   │
│   ├── main/                     # Electron main process
│   │   ├── index.ts              # App entry: createWindow, app lifecycle
│   │   ├── database/
│   │   │   ├── connection.ts     # Open/close SQLite, run migrations
│   │   │   ├── migrations/
│   │   │   │   └── 001-initial-schema.ts
│   │   │   └── repositories/
│   │   │       ├── folder.repo.ts
│   │   │       ├── test-case.repo.ts
│   │   │       ├── test-plan.repo.ts
│   │   │       ├── test-cycle.repo.ts
│   │   │       ├── assignment.repo.ts
│   │   │       └── report.repo.ts
│   │   ├── ipc/
│   │   │   ├── register-all.ts   # Registers all IPC handlers
│   │   │   ├── folder.handlers.ts
│   │   │   ├── test-case.handlers.ts
│   │   │   ├── test-plan.handlers.ts
│   │   │   ├── test-cycle.handlers.ts
│   │   │   ├── assignment.handlers.ts
│   │   │   └── report.handlers.ts
│   │   └── services/
│   │       └── report-generator.ts  # PDF/HTML generation logic
│   │
│   ├── preload/
│   │   └── index.ts              # contextBridge.exposeInMainWorld('api', {...})
│   │
│   └── renderer/                 # React app
│       ├── index.html
│       ├── main.tsx              # React root mount
│       ├── App.tsx               # Top-level layout + router
│       ├── assets/
│       │   └── styles/
│       │       └── global.css
│       ├── contexts/
│       │   ├── AppContext.tsx     # Active plan, active cycle, sidebar state
│       │   └── NotificationContext.tsx  # Toast/snackbar state
│       ├── hooks/
│       │   ├── useApi.ts         # Generic hook: loading, error, data wrapper
│       │   ├── useFolders.ts
│       │   ├── useTestCases.ts
│       │   ├── useTestPlans.ts
│       │   ├── useTestCycles.ts
│       │   ├── useAssignments.ts
│       │   └── useReports.ts
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── MainLayout.tsx
│       │   ├── folder-tree/
│       │   │   ├── FolderTree.tsx
│       │   │   ├── FolderNode.tsx
│       │   │   └── FolderContextMenu.tsx
│       │   ├── test-cases/
│       │   │   ├── TestCaseList.tsx
│       │   │   ├── TestCaseForm.tsx
│       │   │   └── TestCaseDetail.tsx
│       │   ├── test-plans/
│       │   │   ├── TestPlanList.tsx
│       │   │   ├── TestPlanForm.tsx
│       │   │   └── TestPlanDetail.tsx
│       │   ├── test-cycles/
│       │   │   ├── TestCycleList.tsx
│       │   │   ├── TestCycleForm.tsx
│       │   │   └── TestCycleDetail.tsx
│       │   ├── execution/
│       │   │   ├── ExecutionView.tsx
│       │   │   ├── ExecutionCard.tsx
│       │   │   └── AssignmentPicker.tsx
│       │   ├── gantt/
│       │   │   ├── GanttChart.tsx
│       │   │   ├── GanttBar.tsx
│       │   │   └── GanttTimeline.tsx
│       │   ├── reports/
│       │   │   ├── ReportView.tsx
│       │   │   └── ReportSummaryCard.tsx
│       │   └── shared/
│       │       ├── ConfirmDialog.tsx
│       │       ├── EmptyState.tsx
│       │       ├── StatusBadge.tsx
│       │       └── Toast.tsx
│       └── pages/
│           ├── TestLibraryPage.tsx
│           ├── TestPlansPage.tsx
│           ├── TestCycleDetailPage.tsx
│           ├── ExecutionPage.tsx
│           ├── GanttPage.tsx
│           └── ReportsPage.tsx
│
├── tests/
│   ├── main/
│   │   ├── repositories/        # Unit tests for each repo
│   │   └── ipc/                  # Integration tests for IPC handlers
│   └── renderer/
│       ├── components/           # Component tests with React Testing Library
│       └── hooks/                # Hook tests
│
└── .gitignore
```

---

## SQLite Schema

```sql
-- 001-initial-schema.ts (run inside a transaction)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS folder (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    parent_id   INTEGER REFERENCES folder(id) ON DELETE CASCADE,
    path        TEXT    NOT NULL,  -- materialized path e.g. "/Root/Auth/Login"
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_folder_parent ON folder(parent_id);
CREATE UNIQUE INDEX idx_folder_path ON folder(path);

CREATE TABLE IF NOT EXISTS test_case (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    description     TEXT,
    steps           TEXT,             -- stored as plain text or JSON array
    expected_result TEXT,
    folder_id       INTEGER NOT NULL REFERENCES folder(id) ON DELETE CASCADE,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_test_case_folder ON test_case(folder_id);

CREATE TABLE IF NOT EXISTS test_plan (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    version     TEXT    NOT NULL,
    start_date  TEXT    NOT NULL,     -- ISO 8601 date string
    end_date    TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS test_cycle (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    build_name    TEXT    NOT NULL,
    test_plan_id  INTEGER NOT NULL REFERENCES test_plan(id) ON DELETE CASCADE,
    start_date    TEXT,
    end_date      TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_test_cycle_plan ON test_cycle(test_plan_id);

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

CREATE INDEX idx_assignment_cycle ON test_case_assignment(test_cycle_id);
CREATE INDEX idx_assignment_test_case ON test_case_assignment(test_case_id);

CREATE TABLE IF NOT EXISTS test_report (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    test_cycle_id  INTEGER NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
    generated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    format         TEXT    NOT NULL CHECK (format IN ('pdf', 'html')),
    file_path      TEXT              -- path to exported file on disk
);

CREATE INDEX idx_report_cycle ON test_report(test_cycle_id);
```

---

## IPC Communication Strategy

### Pattern

All IPC follows the **invoke/handle** pattern (async request-response):

```
Renderer                     Preload                        Main
─────────                    ───────                        ────
window.api.folders.getAll()
  → ipcRenderer.invoke('folders:get-all')
                                                   → ipcMain.handle('folders:get-all', handler)
                                                   ← returns Folder[]
  ← Promise<Folder[]>
```

### Channel Naming Convention

`{domain}:{action}` -- Examples:
- `folders:get-all`, `folders:get-children`, `folders:create`, `folders:update`, `folders:delete`
- `test-cases:get-by-folder`, `test-cases:create`, `test-cases:update`, `test-cases:delete`
- `test-plans:get-all`, `test-plans:create`, `test-plans:update`, `test-plans:delete`
- `test-cycles:get-by-plan`, `test-cycles:create`, `test-cycles:update`, `test-cycles:delete`
- `assignments:get-by-cycle`, `assignments:assign`, `assignments:unassign`, `assignments:update-status`
- `reports:generate`, `reports:get-by-cycle`, `reports:export`

### Preload API Shape (typed)

```typescript
// Exposed as window.api
interface ElectronAPI {
  folders: {
    getAll(): Promise<Folder[]>;
    getChildren(parentId: number | null): Promise<Folder[]>;
    create(dto: CreateFolderDTO): Promise<Folder>;
    update(id: number, dto: UpdateFolderDTO): Promise<Folder>;
    delete(id: number): Promise<void>;
  };
  testCases: {
    getByFolder(folderId: number): Promise<TestCase[]>;
    getById(id: number): Promise<TestCase>;
    create(dto: CreateTestCaseDTO): Promise<TestCase>;
    update(id: number, dto: UpdateTestCaseDTO): Promise<TestCase>;
    delete(id: number): Promise<void>;
    search(query: string): Promise<TestCase[]>;
  };
  testPlans: { /* CRUD */ };
  testCycles: { /* CRUD + getByPlan */ };
  assignments: {
    getByCycle(cycleId: number): Promise<TestCaseAssignment[]>;
    assign(cycleId: number, testCaseIds: number[]): Promise<void>;
    unassign(assignmentId: number): Promise<void>;
    updateStatus(id: number, status: ExecutionStatus, bugRef?: string): Promise<void>;
  };
  reports: {
    generate(cycleId: number, format: 'pdf' | 'html'): Promise<string>; // returns file path
    getByCycle(cycleId: number): Promise<TestReport[]>;
  };
}
```

---

## Phase-by-Phase Implementation

### Phase 1: Scaffold + Database + Folder Tree + Test Cases

**Objective:** A working app where users can create folders, organize test cases, and perform CRUD on them.

**Steps:**

1. **Project scaffolding**
   - Initialize with `npm create @nicedoc/electron-vite` or manual electron-vite setup
   - Configure TypeScript (3 tsconfigs: node, web, shared)
   - Install dependencies: `electron`, `electron-vite`, `react`, `react-dom`, `better-sqlite3`, `@types/*`
   - Set up `.gitignore`, ESLint, Prettier
   - **Acceptance:** `npm run dev` opens an Electron window with hot reload working

2. **SQLite database layer**
   - Implement `src/main/database/connection.ts` -- open DB file in `app.getPath('userData')`, run migrations
   - Implement `src/main/database/migrations/001-initial-schema.ts` with the full schema above
   - Implement `folder.repo.ts` and `test-case.repo.ts` with all CRUD methods
   - **Acceptance:** Unit tests pass for all repo methods. DB file is created on first launch. Migrations run idempotently.

3. **IPC wiring (folders + test cases)**
   - Implement `src/shared/ipc-channels.ts` and `src/shared/types/`
   - Implement `src/preload/index.ts` with contextBridge for folders and testCases namespaces
   - Implement `src/main/ipc/folder.handlers.ts` and `test-case.handlers.ts`
   - Implement `src/main/ipc/register-all.ts`
   - **Acceptance:** From renderer devtools, `window.api.folders.getAll()` returns an array. `window.api.testCases.create(...)` inserts a row.

4. **Renderer: Folder tree + Test case CRUD UI**
   - Implement `MainLayout`, `Sidebar`, `Header`
   - Implement `FolderTree`, `FolderNode` (recursive rendering, expand/collapse)
   - Implement `FolderContextMenu` (create subfolder, rename, delete with confirmation)
   - Implement `TestCaseList` (table view when a folder is selected)
   - Implement `TestCaseForm` (create/edit dialog with title, description, steps, expected_result)
   - Implement `TestCaseDetail` (read-only detail view)
   - **Acceptance:** User can create a root folder, create nested subfolders, rename/delete folders. User can create test cases inside a folder, edit them, delete them. Deleting a folder cascades to subfolders and their test cases.

### Phase 2: Test Plans + Test Cycles + Assignment

**Objective:** Users can create test plans, add cycles to them, and assign test cases from the library to cycles.

**Steps:**

1. **Backend: Test plan + cycle + assignment repos and IPC**
   - Implement `test-plan.repo.ts`, `test-cycle.repo.ts`, `assignment.repo.ts`
   - Implement corresponding IPC handlers
   - Extend preload with `testPlans`, `testCycles`, `assignments` namespaces
   - **Acceptance:** All CRUD operations work via IPC. Assigning a test case to a cycle creates an assignment with status "Unexecuted". UNIQUE constraint prevents double-assignment.

2. **Renderer: Test Plans + Cycles UI**
   - Implement `TestPlansPage` with list of plans, create/edit form (name, version, start_date, end_date)
   - Implement `TestPlanDetail` showing the plan's cycles
   - Implement `TestCycleForm` (name, build_name, optional dates)
   - Implement `TestCycleDetail` showing assigned test cases with status badges
   - **Acceptance:** User can create a test plan, add multiple cycles to it. Each cycle shows its assigned test cases.

3. **Renderer: Assignment picker**
   - Implement `AssignmentPicker` -- modal/drawer that shows the folder tree + test case list with checkboxes
   - Bulk assign selected test cases to the current cycle
   - Show already-assigned cases as checked/disabled
   - **Acceptance:** User opens a cycle, clicks "Assign Test Cases", browses the folder tree, selects cases, confirms. Assignments appear in the cycle detail view with "Unexecuted" status.

### Phase 3: Test Execution

**Objective:** Users can execute test cases within a cycle, marking each as Pass/Fail/Blocked with optional bug reference.

**Steps:**

1. **Renderer: Execution view**
   - Implement `ExecutionPage` -- opens from a cycle, shows a sequential walkthrough of assigned test cases
   - Implement `ExecutionCard` -- displays test case title, description, steps, expected result. Provides Pass/Fail/Blocked buttons and a bug_ref text input (enabled only for Fail/Blocked)
   - Show progress indicator (e.g., "3 of 12 executed")
   - Allow navigating between assignments (prev/next) and jumping to any assignment
   - **Acceptance:** User opens a cycle's execution view, sees all assigned test cases, can mark each one. Status persists after navigating away and returning. Bug reference is saved for Fail/Blocked items.

2. **Status summary on cycle detail**
   - Add a summary bar to `TestCycleDetail`: counts of Pass/Fail/Blocked/Unexecuted, coverage percentage (executed / total)
   - Color-coded status badges on each assignment row
   - **Acceptance:** After executing some test cases, the cycle detail page shows accurate counts and percentages.

### Phase 4: Gantt Chart

**Objective:** Read-only timeline visualization showing test plans and their cycles on a horizontal timeline.

**Steps:**

1. **Gantt chart component (pure renderer, no new IPC needed)**
   - Implement `GanttChart` -- fetches all test plans (with date ranges) and their cycles
   - Implement `GanttTimeline` -- horizontal date axis with day/week granularity (auto-scale based on date range)
   - Implement `GanttBar` -- horizontal bar component, parent bars for plans, nested child bars for cycles
   - Use CSS grid or absolute positioning (no heavy charting library needed for read-only bars)
   - Plans displayed as colored bars from start_date to end_date. Cycles nested within, using cycle dates if provided, otherwise inheriting plan dates
   - **Acceptance:** Gantt page shows all test plans as horizontal bars on a timeline. Each plan's cycles appear as nested sub-bars. Hovering a bar shows a tooltip with name and dates. Chart scrolls horizontally for long date ranges.

### Phase 5: Reports + Export

**Objective:** Generate and export per-cycle reports as PDF or HTML.

**Steps:**

1. **Report generation service (main process)**
   - Implement `src/main/services/report-generator.ts`
   - Build report data: query assignments by cycle, compute pass/fail/blocked counts, coverage %, list failed/blocked cases with bug references
   - HTML report: generate an HTML string with inline styles (no external CSS needed), render into a hidden BrowserWindow, use `webContents.printToPDF()` for PDF output
   - Save exported file via Electron's `dialog.showSaveDialog`
   - Implement `report.repo.ts` to log generated reports (cycle_id, format, file_path, timestamp)
   - **Acceptance:** User clicks "Export Report" on a cycle, chooses PDF or HTML, picks save location. File is generated with correct data. Report record is saved to DB.

2. **Renderer: Report UI**
   - Implement `ReportView` -- in-app preview of report data (same data as exported)
   - Implement `ReportSummaryCard` -- pass/fail/blocked donut or bar chart (simple CSS-based, no chart library)
   - Table of failed/blocked test cases with bug references
   - Export buttons (PDF, HTML)
   - **Acceptance:** Report page for a cycle shows summary stats, failed/blocked list, and working export buttons.

### Phase 6: Polish + Navigation + Final Testing

**Objective:** End-to-end UX polish, navigation between views, error handling, and comprehensive testing.

**Steps:**

1. **Navigation and routing**
   - Wire up all pages with client-side routing (react-router or simple state-based routing)
   - Sidebar links: Test Library, Test Plans, Gantt Chart
   - Breadcrumb navigation within plan > cycle > execution flows
   - **Acceptance:** User can navigate between all views without losing context. Back button works logically.

2. **Error handling and edge cases**
   - Wrap all IPC calls with try/catch in hooks, show toast notifications on errors
   - Empty states for all list views ("No test cases yet", "No plans created", etc.)
   - Confirmation dialogs for all delete operations
   - Handle edge cases: deleting a plan cascades to cycles and assignments, deleting a test case removes its assignments
   - **Acceptance:** No unhandled promise rejections. All destructive actions require confirmation. Empty states guide user to create first item.

3. **Testing**
   - Repository unit tests (all 6 repos, using in-memory SQLite)
   - IPC handler integration tests (spin up handlers, invoke via mock, verify DB state)
   - React component tests for key interactions: folder tree CRUD, execution status updates, report generation trigger
   - **Acceptance:** Test suite passes. Coverage on repository layer > 90%. All CRUD flows have at least one integration test.

---

## Testing Strategy

| Layer | Tool | What to Test | Location |
|-------|------|-------------|----------|
| Repository | Vitest + in-memory SQLite | All CRUD methods, cascade deletes, constraint violations | `tests/main/repositories/` |
| IPC Handlers | Vitest + real handlers with test DB | End-to-end handler invocation, error responses | `tests/main/ipc/` |
| React Components | Vitest + React Testing Library | User interactions, form validation, rendering states | `tests/renderer/components/` |
| Custom Hooks | Vitest + renderHook | IPC call triggering, loading/error states | `tests/renderer/hooks/` |

**Not in scope:** E2E tests with Playwright/Spectron (can be added later but not required for initial delivery).

---

## Acceptance Criteria Mapping

| Spec Requirement | Phase | Verification |
|-----------------|-------|-------------|
| Folder-tree test case library with arbitrary depth | Phase 1 | Create 3+ levels of nested folders, CRUD test cases within |
| Test Plans with name, version, dates | Phase 2 | Create plan, verify all fields persist |
| Test Cycles as children of plans | Phase 2 | Create multiple cycles under one plan |
| Test Case Assignment to cycles | Phase 2 | Assign cases from library, verify no duplicates |
| Test Execution with Pass/Fail/Blocked + bug_ref | Phase 3 | Execute full cycle, verify statuses and bug refs persist |
| Gantt Chart (read-only timeline) | Phase 4 | Plans as parent bars, cycles as nested bars, correct date spans |
| Exportable Reports (PDF + HTML) | Phase 5 | Export both formats, verify data accuracy |
| Local SQLite, no network | All | App works offline, data in `userData` directory |
| No auth, no multi-tenancy | All | No login screen, single-user by design |

---

## Key Dependencies

| Package | Purpose | Version Guidance |
|---------|---------|-----------------|
| electron | Desktop shell | ^28.x or latest stable |
| electron-vite | Build tooling | ^2.x |
| react, react-dom | UI framework | ^18.x |
| better-sqlite3 | SQLite driver (synchronous, main process) | ^11.x |
| @electron/rebuild | Native module rebuild for better-sqlite3 | latest |
| vitest | Test runner | ^1.x |
| @testing-library/react | Component tests | ^14.x |

---

## Guardrails

### Must Have
- `contextIsolation: true` and `nodeIntegration: false` in BrowserWindow options
- Foreign keys enabled (`PRAGMA foreign_keys = ON`) on every DB connection
- All DB writes wrapped in transactions where multiple statements are involved
- Type-safe IPC: shared types imported by both main and renderer

### Must NOT Have
- No network requests of any kind
- No authentication or user management
- No drag-to-resize on Gantt bars
- No file attachments or rich text editors
- No CI/CD integration hooks
