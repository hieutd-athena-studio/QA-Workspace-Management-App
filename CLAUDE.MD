# CLAUDE.md

Guidance for Claude Code working in this repository.

## ⚠️ START HERE — Your Brain (Obsidian Vault)

**Every session:** Read [`Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md`](Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md) first. This is your Home Base.

Your persistent memory lives in the Obsidian vault at `Brain/`:
- **Rules:** `Brain/QA-Workspace-Management-App/Rules/*.md` — authoritative project constraints
- **Decisions:** `Brain/QA-Workspace-Management-App/ADR/` — architectural decisions
- **Journals:** `Brain/QA-Workspace-Management-App/Journals/` — session logs and follow-ups
- **System overview:** `Brain/Architecture.md` — how the vault is organized

See **Knowledge Vault** section below for full details.

---

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

The Obsidian vault at `Brain/` is your **long-term memory** across sessions.

### Session Workflow

1. **Start:** Read [`Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md`](Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md) (Home Base)
2. **Skim:** Last 1–2 journals in `Brain/QA-Workspace-Management-App/Journals/` for follow-ups
3. **Reference:** Check relevant rule files in `Brain/QA-Workspace-Management-App/Rules/` before suggesting patterns
4. **End:** Write a journal entry to `Brain/QA-Workspace-Management-App/Journals/YYYY-MM-DD-slug.md` summarizing:
   - What shipped
   - Key decisions
   - Unresolved items
   - Follow-ups for next Claude

See [`Brain/Workflows/session-start-workflow.md`](Brain/Workflows/session-start-workflow.md) and [`Brain/Workflows/session-end-workflow.md`](Brain/Workflows/session-end-workflow.md) for detailed checklists.

### Key Files

- **System overview:** [`Brain/Architecture.md`](Brain/Architecture.md)
- **ADRs:** [`Brain/QA-Workspace-Management-App/ADR/`](Brain/QA-Workspace-Management-App/ADR/) — one-time decisions
- **Lessons-Learned:** [`Brain/Library/Lessons-Learned/`](Brain/Library/Lessons-Learned/) — bugs taking > 30min to diagnose
- **File map:** [`Brain/QA-Workspace-Management-App/Context/file-map.md`](Brain/QA-Workspace-Management-App/Context/file-map.md) — exhaustive file listing

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
