---
title: QA-Workspace-Management-App — Context Map
type: context-map
project: QA-Workspace-Management-App
stack: electron+react+typescript+better-sqlite3
status: active
last_reviewed: 2026-04-21
---

# QA-Workspace-Management-App — Context Map

> **Home Base for this repo.** Claude: read this file at session start before touching code.

## 1. One-line purpose

A local desktop app (Electron) for QA engineers to manage test **Projects → Categories → Subcategories → Test Cases → Test Plans → Test Cycles**, execute cycles, and generate reports. Single-user, file-backed SQLite. No server.

## 2. Tech Stack

| Layer | Tech |
|-------|------|
| Shell | Electron (Main + Renderer + Preload) |
| UI | React 18 + TypeScript (strict) |
| DB | better-sqlite3 (synchronous, file-backed) |
| Build | electron-vite + Vite |
| Styling | CSS per component (no Tailwind, no CSS-in-JS) |
| State | React Context only (no Redux, no Zustand) |
| IPC | contextBridge via `src/preload/index.ts` |

Authoritative details: [[project-structure]].

## 3. Entry Points

| File | Role |
|------|------|
| `src/main/index.ts` | Main-process entry — app lifecycle + IPC registration |
| `src/main/database/connection.ts` | DB init + migration runner |
| `src/main/ipc/register-all.ts` | Central IPC handler registration |
| `src/preload/index.ts` | `window.api` surface (contextBridge) |
| `src/preload/index.d.ts` | Types for `window.api` |
| `src/renderer/App.tsx` | Root router + layout |
| `src/shared/types/index.ts` | Central type exports (cross-process) |
| `electron.vite.config.ts` | Build config with path aliases (`@shared`, `@renderer`) |

Exhaustive file-by-file index: [[file-map]]

## 4. Critical Constraints (Do / Don't)

### Don't
- Don't introduce **Redux / Zustand / MobX** — Context only. See [[ADR-004-react-context-over-redux]]
- Don't add **Tailwind** or CSS-in-JS — per-component `.css` files. See [[code-style]]
- Don't nest categories recursively — strict **2 levels**: Category → Subcategory. See [[database]]
- Don't call IPC directly from components — wrap in a hook (`useApi`). See [[api-conventions]]
- Don't concatenate SQL — parameterized queries only
- Don't use `any` — use `unknown` at unsafe boundaries
- Don't put secrets or filesystem access in renderer. See [[security]]

### Do
- Do wrap every IPC handler in `wrapError` (returns `{success, error}`). See [[error-handling]]
- Do compute display IDs (`ARR-TC001`) at **insert time** inside the repository
- Do put `interface Props` at top of component files
- Do keep components under 100 lines — extract to hooks
- Do use arrow-function components: `const X = () => { ... }`

## 5. Domain Model (Hierarchy)

```text
Project (ARR)
 └─ Category                    ← container only, no direct test cases
     └─ Subcategory             ← holds test cases
         └─ Test Case (ARR-TC001)
Project
 └─ Test Plan (ARR-PL001)
     └─ Test Cycle (ARR-PL001-CY01)  ← has `environment` (DEV CHEAT / PROD CHEAT / PROD NON-CHEAT)
         └─ Assignments → Test Case executions
```

Migration `004` dropped the recursive `folder` table → created strict 2-level schema.
Migration `006` added `environment` to `test_cycle`. See [[database]] § "Why this rule exists".

## 6. Dev Commands

```bash
npm install      # deps + electron-builder setup
npm run dev      # electron-vite dev with hot reload
npm run build    # distribution build
npm run preview  # preview built app locally
```

Budget: main bundle < 100 kB, renderer CSS < 100 kB per page.

## 7. Rules (authoritative)

All rule files live in `Rules/` and **override** anything in ADRs or context files.

| Rule | Covers |
|------|--------|
| [[project-structure]] | Directory layout, key files, routing, test cycle features, CSV import |
| [[code-style]] | TypeScript, components, CSS organization, class naming, BEM-light |
| [[api-conventions]] | IPC pattern, preload bridge, React hooks, state management |
| [[database]] | Repository pattern, category hierarchy, display IDs, migrations |
| [[error-handling]] | IPC error wrapping, troubleshooting checklist |
| [[security]] | Validation boundaries, IPC security, SQL injection prevention |
| [[git-workflow]] | Commit style, build targets, performance budgets |
| [[testing]] | Testing strategy and scope |

## 8. Architectural Decisions (ADR Index)

Only decisions that don't fit cleanly as an active rule live here.

| ID | Decision | Status |
|----|----------|--------|
| [[ADR-004-react-context-over-redux]] | React Context for app-level state (no Redux / Zustand / MobX) | Accepted |

New one-off decisions: copy [[ADR-template]] → `ADR/ADR-NNN-slug.md`.

## 9. Context Files

- [[file-map]] — every significant file + purpose

## 10. Session Log (most recent journals)

See `Journals/` — newest on top.

- [[2026-04-20-vault-initialized]] — Obsidian Dev-Brain bootstrapped
