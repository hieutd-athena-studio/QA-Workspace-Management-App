---
date: 2026-04-20
session_type: planning
participants: [hieutd, claude]
related_adrs: [[ADR-004-react-context-over-redux]]
---

> **Note (2026-04-21):** ADR-001, ADR-002, and ADR-003 were merged into rule files on 2026-04-21 to consolidate duplicate documentation. See [[session-end-workflow]] step 7 for the Link Cleanup Rule.

# 2026-04-20 — Vault initialized

## What shipped

- Bootstrapped the Obsidian Dev-Brain for this repo at `./Projects/` (vault lives inside the git repo).
- Wrote [[Architecture]] — the top-level explainer for how this vault works.
- Created the project context pack for **QA-Workspace-Management-App**:
  - [[QA-Workspace-Management-App-Context]] (entry point / Home Base)
  - Four seed ADRs extracted from `CLAUDE.md` + `.claude/rules/*`:
    - ADR-001 (merged into `Rules/api-conventions.md`)
    - ADR-002 (merged into `Rules/database.md`)
    - ADR-003 (merged into `Rules/code-style.md`)
    - [[ADR-004-react-context-over-redux]] (kept as standalone ADR)
  - Context files: [[file-map]]
- Added templates, workflows, and cross-project Library scaffolding.

## Key decisions

- **Vault-inside-repo strategy**: the vault sits at `./Projects/` so Claude sees notes alongside `src/`. No symlinks, no separate git repo for docs.
- **Multi-project schema**: vault supports future projects (e.g. Next.js apps) under `Projects/<Name>/`.
- **Append-only ADRs**: never edit an Accepted ADR — supersede it.
- **Rule files are still canonical**: `CLAUDE.md` + `.claude/rules/*.md` win over anything in the vault. The vault indexes them for Claude's benefit.

## Unresolved / next steps

- Decide whether to commit the `Projects/` vault to git (yes, probably — the decision log has permanent value) or gitignore it (if treated as personal notes).
- First real ADR should document this decision once made.
- As bugs get fixed in future sessions, populate `Library/Lessons-Learned/` with entries taking > 30 min.
- First journal entry for an actual feature session — look for patterns to extract into `Library/Patterns/`.

## Follow-ups for Claude

- At next session start: read [[QA-Workspace-Management-App-Context]] first.
- If a user asks for a "new state-management library" or "Tailwind setup", refer to ADR-003 / ADR-004 before suggesting.
- Keep journals terse and actionable — this file is the template for shape.
