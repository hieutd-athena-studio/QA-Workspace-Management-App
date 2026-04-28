---
title: File Map — QA-Workspace-Management-App
type: context
last_reviewed: 2026-04-20
---

# File Map

> Regenerate after major refactors. Keep one line per file — this is an index, not documentation.

## Main Process — `src/main/`


| File | Purpose |
|------|---------|
| `index.ts` | App lifecycle, window creation, IPC registration |
| `database/connection.ts` | better-sqlite3 init, migration runner |
| `database/migrations/001-initial-schema.ts` | Initial tables |
| `database/migrations/002-add-projects.ts` | `project` table |
| `database/migrations/004-restructure-categories.ts` | Drops `folder`, adds 2-level hierarchy |
| `database/migrations/005-add-plan-summary.ts` | Plan summary columns |
| `database/migrations/006-add-environment-to-test-cycles.ts` | `environment` on test_cycle |
| `database/migrations/007-add-test-types.ts` | Test type field on test cases |
| `database/migrations/008-add-project-color.ts` | `color TEXT` column on project (PRAGMA-guarded) |
| `database/repositories/project.repo.ts` | Project CRUD |
| `database/repositories/category.repo.ts` | Category CRUD |
| `database/repositories/subcategory.repo.ts` | Subcategory CRUD |
| `database/repositories/test-case.repo.ts` | Test case CRUD + display ID generation |
| `database/repositories/test-plan.repo.ts` | Plan CRUD + display IDs |
| `database/repositories/test-cycle.repo.ts` | Cycle CRUD + environment |
| `database/repositories/assignment.repo.ts` | Test-case assignments in a cycle |
| `database/repositories/report.repo.ts` | Report aggregation queries |
| `ipc/register-all.ts` | Registers all IPC handlers at startup |
| `ipc/project.handlers.ts` | Project IPC |
| `ipc/category.handlers.ts` | Category IPC |
| `ipc/subcategory.handlers.ts` | Subcategory IPC |
| `ipc/test-case.handlers.ts` | Test-case IPC (incl. CSV import) |
| `ipc/test-plan.handlers.ts` | Plan IPC |
| `ipc/test-cycle.handlers.ts` | Cycle IPC |
| `ipc/assignment.handlers.ts` | Assignment IPC |
| `ipc/report.handlers.ts` | Report IPC |
| `services/report-generator.ts` | Report rendering / export |

## Preload — `src/preload/`

| File | Purpose |
|------|---------|
| `index.ts` | `contextBridge.exposeInMainWorld('api', ...)` |
| `index.d.ts` | Ambient types for `window.api` |

## Renderer — `src/renderer/`

| File | Purpose |
|------|---------|
| `App.tsx` | Root router, layout, project guard |
| `main.tsx` | React root bootstrap |
| `contexts/ProjectContext.tsx` | Selected project + localStorage |
| `contexts/NotificationContext.tsx` | Toast stack |
| `contexts/InvalidationContext.tsx` | Cache invalidation flags |
| `hooks/useApi.ts` | Typed IPC data hook with cache key |
| `pages/ProjectsPage.tsx` / `.css` | Project list + create |
| `pages/TestLibraryPage.tsx` / `.css` | Category → Subcategory → Test Cases |
| `pages/TestPlansPage.tsx` / `.css` | Plan list |
| `pages/TestPlanDetailPage.tsx` / `.css` | Plan editor + cycles |
| `pages/TestCycleDetailPage.tsx` / `.css` | Grouped accordion cycle view |
| `pages/ExecutionPage.tsx` / `.css` | Cycle execution flow |
| `pages/DashboardPage.tsx` / `.css` | Cross-project health dashboard |
| `pages/ReportsPage.tsx` / `.css` | Reports |
| `components/layout/**` | Shell, sidebar, header |
| `components/category-panel/**` | Category/Subcategory selection panel |
| `components/test-cases/**` | Test-case form + list |
| `components/execution/**` | Execution UI |
| `components/shared/**` | `ConfirmDialog`, modals, shared atoms |
| `assets/styles/global.css` | Design tokens + utility classes |

## Shared — `src/shared/`

| File | Purpose |
|------|---------|
| `types/index.ts` | Central re-exports |
| `types/ipc-result.ts` | `{ success?: T, error?: string }` |
| `types/<domain>.ts` | Per-domain DTOs (single source of truth) |
| `ipc-channels.ts` | Named IPC channel constants |
| `utils/steps.ts` | Step parsing (CSV `action -> expected`) |
| `utils/working-days.ts` | VN-holiday-aware working days utils (deadline status, budget, progress) |
| `utils/dashboard.ts` | `calculateProjectHealth(plans)` — healthy = 100% tasks + not overdue |

## Config — repo root

| File | Purpose |
|------|---------|
| `electron.vite.config.ts` | Build config + path aliases |
| `tsconfig.json` | Strict TS config |
| `package.json` | Deps + npm scripts |
| `CLAUDE.md` | Top-level rules for Claude |
| `DESIGN.md` | Design system reference |
| `Brain/QA-Workspace-Management-App/Rules/*.md` | Detailed rule files (authoritative) |

## Obsidian Vault — `Projects/`

See [[Architecture]] for the vault layout.
