# Project Structure

## Stack

- **Frontend:** React 18 + TypeScript (Renderer Process)
- **Backend:** Electron Main Process + better-sqlite3
- **Communication:** IPC via preload contextBridge (strict type bridge)
- **Build:** electron-vite + Vite
- **Styling:** CSS files per component (no Tailwind, no CSS-in-JS)
- **State:** React Context for app-level state (project, notifications, cache invalidation)

## Process Separation

**Main Process** (`src/main/`)
- Database operations via better-sqlite3
- IPC handlers that expose APIs to renderer
- App lifecycle and system operations
- No React code

**Renderer Process** (`src/renderer/`)
- React components and pages
- Calls IPC handlers via window.api
- Component state with React hooks + Context
- All UI rendering

**Preload Bridge** (`src/preload/`)
- `index.ts`: Defines window.api object with safe IPC methods
- `index.d.ts`: TypeScript type declarations for window.api

## Directory Structure

```
src/
├── main/
│   ├── index.ts                 # Entry point, app lifecycle, IPC registration
│   ├── database/
│   │   ├── connection.ts        # better-sqlite3 init + migration runner
│   │   ├── migrations/
│   │   │   ├── 001-initial-schema.ts
│   │   │   ├── 002-add-projects.ts
│   │   │   ├── 004-restructure-categories.ts
│   │   │   ├── 005-add-plan-summary.ts
│   │   │   └── 006-add-environment-to-test-cycles.ts
│   │   └── repositories/
│   │       ├── project.repo.ts
│   │       ├── category.repo.ts
│   │       ├── subcategory.repo.ts
│   │       ├── test-case.repo.ts
│   │       ├── test-plan.repo.ts
│   │       ├── test-cycle.repo.ts
│   │       ├── assignment.repo.ts
│   │       └── report.repo.ts
│   ├── ipc/
│   │   ├── register-all.ts
│   │   ├── project.handlers.ts
│   │   ├── category.handlers.ts
│   │   ├── subcategory.handlers.ts
│   │   ├── test-case.handlers.ts
│   │   ├── test-plan.handlers.ts
│   │   ├── test-cycle.handlers.ts
│   │   ├── assignment.handlers.ts
│   │   └── report.handlers.ts
│   └── services/
│       └── report-generator.ts
├── renderer/
│   ├── App.tsx                  # Root router + layout
│   ├── main.tsx
│   ├── contexts/
│   │   ├── ProjectContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── InvalidationContext.tsx
│   ├── hooks/
│   │   └── useApi.ts
│   ├── pages/
│   │   ├── ProjectsPage.tsx / .css
│   │   ├── TestLibraryPage.tsx / .css
│   │   ├── TestPlansPage.tsx / .css
│   │   ├── TestPlanDetailPage.tsx / .css
│   │   ├── TestCycleDetailPage.tsx / .css
│   │   ├── ExecutionPage.tsx / .css
│   │   ├── GanttPage.tsx / .css
│   │   └── ReportsPage.tsx / .css
│   ├── components/
│   │   ├── layout/
│   │   ├── category-panel/
│   │   ├── test-cases/
│   │   ├── execution/
│   │   └── shared/
│   └── assets/styles/
│       └── global.css           # Design tokens + shared utility classes
├── shared/
│   ├── types/                   # Single source of truth for types
│   ├── ipc-channels.ts
│   └── utils/steps.ts
└── preload/
    ├── index.ts
    └── index.d.ts
```

## Key Files

| File | Purpose |
|------|---------|
| `src/main/index.ts` | Entry point, app lifecycle, IPC registration |
| `src/renderer/App.tsx` | Router + page structure |
| `src/preload/index.ts` | window.api definition |
| `src/preload/index.d.ts` | Types for window.api |
| `src/shared/types/index.ts` | Central type exports |
| `electron.vite.config.ts` | Build config with path aliases |
| `tsconfig.json` | TypeScript config (strict mode) |
| `DESIGN.md` | Complete design system |

## Routing & Navigation

- **React Router (client-side):** Routes in `src/renderer/App.tsx`
- **No Server Rendering:** All pages are CSR
- **Project Guard Pattern:** All workspace pages check `selectedProject`
- App loads → redirect to `/projects` if no project selected
- Select project → navigate to `/library`

## Test Cycle Features

### Environment Field

```typescript
export enum TestCycleEnvironment {
  DEV_CHEAT      = 'DEV CHEAT',
  PROD_CHEAT     = 'PROD CHEAT',
  PROD_NON_CHEAT = 'PROD NON-CHEAT',
}
```

Color coding via `getEnvironmentClass()`:
- `env-dev-cheat` — Blue (`#005ac2`)
- `env-prod-cheat` — Orange (`#ea580c`)
- `env-prod-non-cheat` — Amber (`#d97706`)

### Grouped View (TestCycleDetailPage)

Two-level collapsible accordion: **Category → Subcategory → Test Case rows**

State: `collapsedCategories: Set<string>`, `collapsedSubcategories: Set<string>` (keys: `catName`, `catName::subName`)

### CSV Import Rules

- Accepts `Subcategory` or `Sub-category`
- Accepts `Expected Result` or `expected_result`
- Steps separated by `;` or `|` — both valid
- Leading step numbers (`1.`, `1)`) stripped automatically
- Per-step expected results use `->` inline: `action -> expected result`
- Required: `Category`, `Subcategory`, `Title`
- Optional: `Description`, `Steps`, `Expected Result`, `Version`

**Steps column example:**
```
Enter username -> Field accepts input | Click submit -> Dashboard loads
```

**Two distinct expected result fields:**
- `Steps` column: `action -> expected` → maps to `TestStep.expected` (per-step)
- `Expected Result` column → maps to `TestCase.expected_result` (overall summary)

## Doc-Sync Rule

**Whenever `src/` structure changes, update these docs in the same commit — no exceptions:**

| Changed | Update |
|---|---|
| Folder added / moved / renamed inside `src/` | Directory Structure tree in this file (above) |
| File added, moved, or renamed in `src/` | `Brain/QA-Workspace-Management-App/Context/file-map.md` per-file table |
| New top-level folder at repo root | `Brain/Architecture.md` §4 repo diagram |
| Build scripts or entry-point paths change | `CLAUDE.md` Quick Start section |

When the `Brain/` vault structure itself changes (new folder, renamed path):
- `Brain/Architecture.md` §2 vault diagram **and** §4 repo diagram
- If a `Rules/` file is added or removed: `QA-Workspace-Management-App-Context.md` Rules section + `CLAUDE.md` Rules table

Stale diagrams → Claude misreads the project on the next session start. Keep them current.

**Before deleting any vault file**, grep `Brain/` for its name and remove all wikilinks and table rows that reference it. See the Link Cleanup Rule in `Brain/Architecture.md` §8 for the exact steps.
