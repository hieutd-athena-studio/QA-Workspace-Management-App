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

## Rules

Detailed rules live in `.claude/rules/`:

| Rule File | Covers |
|-----------|--------|
| [`project-structure.md`](.claude/rules/project-structure.md) | Directory layout, key files, routing, test cycle features, CSV import |
| [`code-style.md`](.claude/rules/code-style.md) | TypeScript, components, CSS organization, class naming |
| [`api-conventions.md`](.claude/rules/api-conventions.md) | IPC pattern, preload bridge, React hooks, state management |
| [`database.md`](.claude/rules/database.md) | Repository pattern, category hierarchy, display IDs, migrations |
| [`error-handling.md`](.claude/rules/error-handling.md) | IPC error wrapping, troubleshooting checklist |
| [`security.md`](.claude/rules/security.md) | Validation boundaries, IPC security, SQL injection prevention |
| [`git-workflow.md`](.claude/rules/git-workflow.md) | Commit style, build targets, performance |
| [`testing.md`](.claude/rules/testing.md) | Testing strategy and scope |

## Design System

See **DESIGN.md** for colors, typography, spacing tokens, and component patterns.

Key tokens: `--primary`, `--success`, `--warning`, `--critical`, `--sp-1`…`--sp-16`, `--radius-*`
