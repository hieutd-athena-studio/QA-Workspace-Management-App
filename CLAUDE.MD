# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Electron + React Standards (QA Workspace App)

## Quick Start: Development Commands

```bash
npm run dev          # Start electron-vite dev server (hot reload on all changes)
npm run build        # Build for distribution
npm run preview      # Preview built app locally
npm run start        # Alias for preview
npm install          # Installs deps + postinstall runs electron-builder setup
```

**Most common:** Use `npm run dev` for active development. Watches main/preload/renderer and auto-reloads.

---

## 1. Architecture Overview

### Stack

- **Frontend:** React 18 + TypeScript (Renderer Process)
- **Backend:** Electron Main Process + better-sqlite3
- **Communication:** IPC via preload contextBridge (strict type bridge)
- **Build:** electron-vite + Vite
- **Styling:** CSS files per component (no Tailwind, no CSS-in-JS)
- **State:** React Context for app-level state (project, notifications, cache invalidation)

### Process Separation

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

### Project Directory Structure

```
src/
├── main/
│   ├── index.ts                 # Entry point, app lifecycle, IPC registration
│   ├── database/
│   │   ├── connection.ts        # better-sqlite3 init + migration runner
│   │   ├── migrations/
│   │   │   ├── 001-initial-schema.ts
│   │   │   └── 002-add-projects.ts
│   │   └── repositories/
│   │       ├── project.repo.ts  # One repo per entity
│   │       ├── folder.repo.ts
│   │       ├── test-case.repo.ts
│   │       ├── test-plan.repo.ts
│   │       ├── test-cycle.repo.ts
│   │       ├── assignment.repo.ts
│   │       └── report.repo.ts
│   ├── ipc/
│   │   ├── register-all.ts      # Centralized IPC registration
│   │   ├── project.handlers.ts  # One handler file per domain
│   │   ├── folder.handlers.ts
│   │   ├── test-case.handlers.ts
│   │   ├── test-plan.handlers.ts
│   │   ├── test-cycle.handlers.ts
│   │   ├── assignment.handlers.ts
│   │   └── report.handlers.ts
│   └── services/
│       └── report-generator.ts  # Business logic, not tied to IPC
├── renderer/
│   ├── App.tsx                  # Root router + layout
│   ├── main.tsx                 # React DOM mount
│   ├── contexts/
│   │   ├── ProjectContext.tsx   # Selected project state
│   │   ├── NotificationContext.tsx # Toasts
│   │   └── InvalidationContext.tsx # Cache invalidation
│   ├── hooks/
│   │   └── useApi.ts            # Generic IPC call hook
│   ├── pages/
│   │   ├── ProjectsPage.tsx
│   │   ├── TestLibraryPage.tsx
│   │   ├── TestPlansPage.tsx
│   │   ├── TestPlanDetailPage.tsx
│   │   ├── TestCycleDetailPage.tsx
│   │   ├── ExecutionPage.tsx
│   │   ├── GanttPage.tsx
│   │   └── ReportsPage.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── folder-tree/
│   │   │   ├── FolderTree.tsx
│   │   │   └── FolderNode.tsx
│   │   ├── test-cases/
│   │   │   ├── TestCaseForm.tsx
│   │   │   └── TestCaseList.tsx
│   │   ├── execution/
│   │   │   └── AssignmentPicker.tsx
│   │   └── shared/
│   │       ├── ConfirmDialog.tsx
│   │       └── EmptyState.tsx
│   └── assets/
│       └── styles/
│           ├── variables.css    # Color & spacing tokens
│           └── global.css       # Shared utility classes
├── shared/
│   ├── types/                   # Single source of truth for types
│   │   ├── project.ts
│   │   ├── folder.ts
│   │   ├── test-case.ts
│   │   ├── test-plan.ts
│   │   ├── test-cycle.ts
│   │   ├── assignment.ts
│   │   ├── report.ts
│   │   ├── ipc-result.ts        # { success?: T, error?: string }
│   │   └── index.ts
│   ├── ipc-channels.ts          # Channel name constants
│   └── utils/
│       └── steps.ts             # Shared utilities
└── preload/
    ├── index.ts                 # window.api definition
    └── index.d.ts               # TypeScript types for window.api
```

## 2. TypeScript Excellence

- **Strictness:** No `any`. Use `unknown` for unsafe boundaries.
- **Shared Types:** Single source of truth in `src/shared/types/`. Split by domain (folder.ts, test-case.ts, etc).
- **Type vs Interface:** Use `interface` for public APIs/Props. Use `type` for Unions, DTOs, Discriminated unions.
- **No Cross-Process Leaks:** Types are shared; implementations are not. IPC handlers translate.

## 3. IPC Communication Pattern

### Handler Layer (Main Process)

Create one handler file per domain:

```typescript
// src/main/ipc/<domain>.handlers.ts
import { IpcMain } from 'electron'
import { Database } from 'better-sqlite3'
import { wrapError, wrapSuccess } from '@shared/utils/ipc-error'
import { <Domain>Repo } from '../database/repositories/<domain>.repo'

export const register<Domain>Handlers = (ipcMain: IpcMain, db: Database) => {
  ipcMain.handle('api:<domain>:create', wrapError(async (_, dto) => {
    const repo = new <Domain>Repo(db);
    return wrapSuccess(await repo.create(dto));
  }));

  ipcMain.handle('api:<domain>:getById', wrapError(async (_, id) => {
    const repo = new <Domain>Repo(db);
    return wrapSuccess(await repo.getById(id));
  }));
};
```

Then register all handlers in the main process:

```typescript
// src/main/ipc/register-all.ts
import { IpcMain } from "electron";
import { Database } from "better-sqlite3";
import { registerProjectHandlers } from "./project.handlers";
import { registerFolderHandlers } from "./folder.handlers";
// ... import all other handlers

export const registerAllHandlers = (ipcMain: IpcMain, db: Database) => {
  registerProjectHandlers(ipcMain, db);
  registerFolderHandlers(ipcMain, db);
  // ... register all others
};

// src/main/index.ts - Call this during app initialization:
import { registerAllHandlers } from "./ipc/register-all";
// ... in createWindow or app ready handler:
registerAllHandlers(ipcMain, db);
```

### Preload Bridge (Strict Type Bridge)

```typescript
// src/preload/index.ts
export const api = {
  <domain>: {
    create: (dto) => ipcRenderer.invoke('api:<domain>:create', dto),
  },
};

// src/preload/index.d.ts - declare window.api types
```

### React Hook (Client Layer)

```typescript
// src/renderer/hooks/useApi.ts - Generic hook for IPC calls
const { data, loading } = useApi<T>(
  () => window.api.<domain>.fetch(id),
  [id],
  'domain-cache-key'
);
```

**Rule:** No IPC calls directly in components. Always wrap in hooks or services.

## 4. State Management

### Context + useState (for local/app-wide state)

- **ProjectContext:** Selected project (persists to localStorage)
- **NotificationContext:** Toast/notifications
- **InvalidationContext:** Cache invalidation domains
- **FolderTree:** Folder selection state

**When to use Context:**

- ✅ Selected items (project, folder, cycle)
- ✅ App-level settings (theme, layout state)
- ✅ Cache invalidation signals
- ❌ High-frequency updates (scroll, mouse pos)
- ❌ Deeply nested prop drilling (use composition instead)

### Invalidation Pattern

```typescript
const { invalidate } = useInvalidation();
// After create/update/delete:
invalidate("testCases"); // Clear cache for that domain
```

## 5. Component Patterns

### File Structure

```
src/renderer/
├── components/
│   ├── folder-tree/
│   │   ├── FolderTree.tsx
│   │   └── FolderTree.css
│   ├── test-cases/
│   │   ├── TestCaseForm.tsx
│   │   ├── TestCaseForm.css
│   │   └── TestCaseList.tsx
│   └── shared/
│       └── ConfirmDialog.tsx
└── pages/
    ├── TestLibraryPage.tsx
    └── TestLibraryPage.css
```

### Component Rules

- **Arrow Functions Only:** `const Component = () => {}`
- **Keep < 100 lines:** Extract logic into custom hooks
- **Early Returns:** Minimize nesting
- **No Inline Styles:** Use CSS files. Split `.css` per component.
- **Props Interface:** One `interface Props { ... }` at top of file
- **No Default Exports from Folders:** Import from exact file paths

### Modal/Overlay Pattern

Use shared `tcf-*` CSS classes (TestCaseForm foundation):

```css
.tcf-overlay {
  /* darkened background */
}
.tcf-modal {
  /* centered dialog */
}
.tcf-label {
  /* form labels */
}
.tcf-footer {
  /* button row */
}
```

## 6. Database & Repository Pattern

### Repository Layer (src/main/database/repositories/)

- **One Repo per Entity:** `project.repo.ts`, `folder.repo.ts`, etc.
- **Computed Fields at DB Layer:** Display IDs, denormalized counts
- **Prepared Statements:** Use parameterized queries. No string concatenation.
- **Migrations:** Safe column-checks before ALTER TABLE

```typescript
export class TestCaseRepo {
  create(dto: CreateTestCaseDTO) {
    /* insert + return with display_id */
  }
  getByFolder(folderId) {
    /* join with display_id generation */
  }
  generateDisplayId(folderId) {
    /* join folder→project to get code */
  }
}
```

### Display IDs (Generated Once, Stored)

- **Test Cases:** `ARR-TC001` (stored in DB)
- **Test Plans:** `ARR-PL001` (stored in DB)
- **Test Cycles:** `ARR-PL001-CY01` (stored in DB)
- **Folders:** No display ID (structural containers)

Compute at insert time in repository, not on-the-fly.

## 7. Routing & Navigation

- **React Router (client-side):** Routes live in `src/renderer/App.tsx`
- **No Server Rendering:** All pages are CSR
- **Project Guard Pattern:** All workspace pages check `selectedProject` and show no-project guard if missing
- **Navigation Flow:**
  - App loads → redirect to `/projects` if no project selected
  - Select project → navigate to `/library`
  - Breadcrumb/sidebar navigation within workspace

## 8. Styling Guidelines

### CSS Organization

- **One `.css` file per component.** No CSS-in-JS, no Tailwind.
- **Global Variables:** `src/renderer/assets/styles/variables.css`
  - Colors: `--primary`, `--critical`, `--success`, etc.
  - Spacing: `--sp-1`, `--sp-2`, `--sp-4`, `--sp-8`, etc.
  - Typography: Font scales defined in global
- **Shared Patterns:** `src/renderer/assets/styles/global.css`
  - `.no-project-guard` — guard layout for empty project state
  - `.data-table` — standard table styling
  - `.btn`, `.btn-primary`, `.btn-secondary` — button patterns
  - `.text-muted`, `.body-sm`, `.label-md` — typography utilities

### Class Naming

- **BEM-light:** `.component-name` parent, `.component-name-child` children
- **Status Classes:** `.status-passed`, `.status-failed`, `.status-blocked`, `.status-pending`
- **State Classes:** `.active`, `.disabled`, `.loading`
- **Utility Classes:** `.text-muted`, `.mono`, `secondary`

## 9. Token & Context Optimization

### Response Mode

- **Act as Architect:** Be concise, no preambles
- **Show Diffs Only:** Don't re-write entire files unless major refactor
- **Ask for Clarification:** On ambiguous requests
- **Use Diffs for Changes:** Edit + Read + Verify pattern

### File Reading

- Don't re-read files unless context has changed
- Parallel read when analyzing multiple related files
- Use Grep for large codebase searches

## 10. Error Handling

### IPC Error Pattern

```typescript
// Main process
const wrapError =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      return { error: e.message };
    }
  };

// Renderer
const result = await window.api.call();
if (result.error) notify(result.error, "error");
```

### Validation

- Validate at system boundaries (user input, IPC input)
- Trust internal code and DB constraints
- No defensive checks for impossible states

## 11. Testing Strategy

- **No TDD mandate:** But write regression tests after behavior changes
- **Integration tests preferred:** Test IPC layer + DB together
- **Unit tests for logic:** Pure functions, display ID generation
- **Manual testing:** UI flows (modals, navigation, project selection)

## 12. Git Workflow

- **Atomic commits:** One feature = one commit (unless splitting for clarity)
- **Commit messages:** Feature-focused, reference files changed
- **No force pushes** to main
- **PR reviews:** Code follows these standards

## 13. Build & Performance

- **Main bundle target:** < 100kB
- **Renderer CSS target:** < 100kB per page
- **Lazy load:** Pages load on route, not upfront
- **Tree-shake:** Export only what's used; remove unused re-exports

## 14. Design System

All UI colors, typography, spacing, and component patterns are documented in **DESIGN.md**.

**Key tokens:**

- Colors: `--primary`, `--success`, `--warning`, `--critical`, `--on-surface`, `--on-surface-variant`
- Surfaces: `--sidebar-bg`, `--surface`, `--surface-container-*`
- Spacing: `--sp-1` through `--sp-16` (4px base)
- Radius: `--radius-sm`, `--radius-default`, `--radius-lg`, `--radius-xl`
- Typography: Plus Jakarta Sans (UI), JetBrains Mono (codes/IDs)

Refer to DESIGN.md for complete component specifications, color palette, shadow rules, and class naming conventions.

## 15. Key Files to Know

| File                        | Purpose                                                 |
| --------------------------- | ------------------------------------------------------- |
| `src/main/index.ts`         | Entry point, app lifecycle, IPC registration            |
| `src/renderer/App.tsx`      | Router + page structure                                 |
| `src/preload/index.ts`      | window.api definition                                   |
| `src/preload/index.d.ts`    | Types for window.api                                    |
| `src/shared/types/index.ts` | Central type exports                                    |
| `electron.vite.config.ts`   | Build config with path aliases                          |
| `tsconfig.json`             | TypeScript config (strict mode)                         |
| `DESIGN.md`                 | Complete design system (colors, typography, components) |

## 16. Troubleshooting

### IPC Method Not Found

**Problem:** `window.api.<method>` is undefined

**Checklist:**

1. Is the method exposed in `src/preload/index.ts`?
2. Are types declared in `src/preload/index.d.ts`?
3. Is the IPC handler registered in `src/main/ipc/<domain>.handlers.ts`?
4. Is the handler file imported and called in `src/main/ipc/register-all.ts`?
5. Are handlers registered in `src/main/index.ts` (during app init)?

### Database Connection Issues

- Check migrations ran via `src/main/database/connection.ts`
- Use better-sqlite3 prepared statement syntax (`.all()`, `.get()`, `.run()`)
- Verify foreign key constraints are enforced

### Hot Reload Not Working

- Restart `npm run dev`
- Check electron-vite config watch paths
- Verify no syntax errors in changed files
- Clear `.vite` cache if needed

### TypeScript Errors on window.api

- Ensure `src/preload/index.d.ts` exports proper types
- Check `tsconfig.json` includes preload types
- Use `import type` for type-only imports in preload

### Build Fails

- Check `electron.vite.config.ts` for correct entry points
- Verify all imports use correct path aliases (`@shared`, `@renderer`)
- Ensure no circular dependencies
- Run `npm install` to update deps and electron-builder setup
