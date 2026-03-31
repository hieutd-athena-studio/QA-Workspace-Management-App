# Electron + React Standards (QA Workspace App)

## 1. Architecture Overview

- **Frontend:** React 18 + TypeScript (Renderer Process)
- **Backend:** Electron Main Process + better-sqlite3
- **Communication:** IPC (preload bridge pattern)
- **Build:** electron-vite + Vite
- **Styling:** CSS files per component (no Tailwind, no CSS-in-JS)

## 2. TypeScript Excellence

- **Strictness:** No `any`. Use `unknown` for unsafe boundaries.
- **Shared Types:** Single source of truth in `src/shared/types/`. Split by domain (folder.ts, test-case.ts, etc).
- **Type vs Interface:** Use `interface` for public APIs/Props. Use `type` for Unions, DTOs, Discriminated unions.
- **No Cross-Process Leaks:** Types are shared; implementations are not. IPC handlers translate.

## 3. IPC Communication Pattern

### Handler Layer (Main Process)
```typescript
// src/main/ipc/<domain>.handlers.ts
export const register<Domain>Handlers = (ipcMain: IpcMain) => {
  ipcMain.handle('api:<domain>:create', wrapError(async (_, dto) => {
    const repo = new <Domain>Repo(db);
    return wrapSuccess(await repo.create(dto));
  }));
};
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
invalidate('testCases'); // Clear cache for that domain
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
.tcf-overlay { /* darkened background */ }
.tcf-modal { /* centered dialog */ }
.tcf-label { /* form labels */ }
.tcf-footer { /* button row */ }
```

## 6. Database & Repository Pattern

### Repository Layer (src/main/database/repositories/)
- **One Repo per Entity:** `project.repo.ts`, `folder.repo.ts`, etc.
- **Computed Fields at DB Layer:** Display IDs, denormalized counts
- **Prepared Statements:** Use parameterized queries. No string concatenation.
- **Migrations:** Safe column-checks before ALTER TABLE

```typescript
export class TestCaseRepo {
  create(dto: CreateTestCaseDTO) { /* insert + return with display_id */ }
  getByFolder(folderId) { /* join with display_id generation */ }
  generateDisplayId(folderId) { /* join folder→project to get code */ }
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
const wrapError = (fn) => async (...args) => {
  try {
    return await fn(...args);
  } catch (e) {
    return { error: e.message };
  }
};

// Renderer
const result = await window.api.call();
if (result.error) notify(result.error, 'error');
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
