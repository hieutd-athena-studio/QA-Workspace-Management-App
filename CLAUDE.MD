# CLAUDE.md

Guidance for Claude Code working in this repository.

## Quick Start

```bash
npm run dev       # Start electron-vite dev server (hot reload)
npm run build     # Build for distribution
npm run preview   # Preview built app locally
npm install       # Install deps + electron-builder setup
```

## Stack

**Electron + React 18 + TypeScript + better-sqlite3**

- Main Process: database, IPC handlers, app lifecycle
- Renderer Process: React UI (window.api calls only)
- Preload Bridge: strict contextBridge (`src/preload/index.ts`)
- Build: electron-vite | Styling: CSS per component (no Tailwind)

## Knowledge Vault

Claude's persistent context, decisions, and session memory live in the Obsidian vault at `Brain/`:

- **System overview:** [`Brain/Architecture.md`](Brain/Architecture.md)
- **Project Home Base:** [`Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md`](Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md) — read this first each session

Session logs (`Brain/QA-Workspace-Management-App/Journals/`), ADRs, and lessons-learned all live under `Brain/`.

## Rules

Detailed rules live in `Brain/QA-Workspace-Management-App/Rules/`:

| Rule File | Covers |
|-----------|--------|
| [`project-structure.md`](Brain/QA-Workspace-Management-App/Rules/project-structure.md) | Directory layout, key files, routing, test cycle features, CSV import |
| [`code-style.md`](Brain/QA-Workspace-Management-App/Rules/code-style.md) | TypeScript, components, CSS organization, class naming |
| [`api-conventions.md`](Brain/QA-Workspace-Management-App/Rules/api-conventions.md) | IPC pattern, preload bridge, React hooks, state management |
| [`database.md`](Brain/QA-Workspace-Management-App/Rules/database.md) | Repository pattern, category hierarchy, display IDs, migrations |
| [`error-handling.md`](Brain/QA-Workspace-Management-App/Rules/error-handling.md) | IPC error wrapping, troubleshooting checklist |
| [`security.md`](Brain/QA-Workspace-Management-App/Rules/security.md) | Validation boundaries, IPC security, SQL injection prevention |
| [`git-workflow.md`](Brain/QA-Workspace-Management-App/Rules/git-workflow.md) | Commit style, build targets, performance |
| [`testing.md`](Brain/QA-Workspace-Management-App/Rules/testing.md) | Testing strategy and scope |

## Design System

See **DESIGN.md** for colors, typography, spacing tokens, and component patterns.

Key tokens: `--primary`, `--success`, `--warning`, `--critical`, `--sp-1`…`--sp-16`, `--radius-*`
