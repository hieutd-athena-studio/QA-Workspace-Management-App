---
title: Obsidian Dev-Brain Architecture
type: index
status: active
last_reviewed: 2026-04-21
---

# Obsidian Dev-Brain Architecture

> Persistent, queryable **Specification Layer** for Claude Code. This vault stores the project's rules, decisions, and session memory — so Claude doesn't lose context at the end of a session.

## 1. Core Philosophy — "Context-as-Code"

Treat context like source code: versioned, linkable, and specific.

| Layer | Role |
|-------|------|
| **Claude Code** | CPU / Worker — executes tasks in the terminal |
| **`Brain/` vault (this)** | RAM / Storage — rules, ADRs, tech constraints, session memory |
| **The Git Repository** | Source of truth for **code** |
| **This Vault** | Source of truth for **rules, decisions, and session memory** |

The vault is **multi-project** and **stack-agnostic**. It currently holds one Electron+React project (`QA-Workspace-Management-App`) with its rule files, and is designed to scale to Next.js / backend / any future repos.

## 2. Vault Structure

```text
Brain/ (vault root)
├── Architecture.md                 ← YOU ARE HERE (index of the whole system)
├── Welcome.md                      ← landing page
│
├── QA-Workspace-Management-App/    ← per-project context pack
│   ├── QA-Workspace-Management-App-Context.md   ← Home Base / Context Map
│   ├── Rules/                      ← authoritative project rules
│   │   ├── project-structure.md
│   │   ├── code-style.md
│   │   ├── api-conventions.md
│   │   ├── database.md
│   │   ├── error-handling.md
│   │   ├── security.md
│   │   ├── git-workflow.md
│   │   └── testing.md
│   ├── ADR/                        ← Architecture Decision Records
│   ├── Context/                    ← File map and other references
│   ├── Specs/                      ← Technical requirements, user stories
│   └── Journals/                   ← Dated session logs
│
├── Library/                        ← Cross-project knowledge
│   ├── Patterns/                       ← Reusable design patterns
│   ├── Boilerplates/                   ← Snippets to reuse
│   └── Lessons-Learned/                ← Post-mortems, weird bugs, fixes
│
├── LLM-Config/                     ← Claude Code configuration
│   ├── System-Prompts/                 ← Personas
│   └── Tool-Schemas/                   ← Local scripts / MCP servers
│
├── Workflows/                      ← Repeatable process checklists
│   ├── session-start-workflow.md
│   ├── session-end-workflow.md
│   └── new-feature-workflow.md
│
└── Templates/                      ← Obsidian templates for new notes
    ├── ADR-template.md
    ├── Journal-template.md
    ├── Context-Map-template.md
    └── Lesson-Learned-template.md
```

## 3. Key Components Explained

### A. Context Maps — `<ProjectName>-Context.md`

The **single entry point** for any project. When Claude starts a session, load this first.

Contains:

- One-line project purpose
- Tech stack summary
- Entry points (`main.ts`, `index.tsx`, …)
- Critical constraints (what NOT to do — "no Redux", "no Tailwind", …)
- Links to Rules, ADRs, Context files, Journals

> **Session opener:**
> `claude "Read [[QA-Workspace-Management-App-Context]] to get started."`

### B. Rules — `<Project>/Rules/*.md`

Authoritative project rules. Claude **must** follow them. Each rule file has:

- The rule itself (the "what / how")
- A `## Why this rule exists` section where non-obvious (the "why / tradeoffs")

Rules live inside the project folder because they're project-specific. Future projects will have their own `Rules/` folders with different conventions.

### C. ADRs — Architecture Decision Records

One file per non-trivial decision **not** already captured as a rule. Prevents Claude from re-suggesting rejected patterns.

Format: `ADR-NNN-short-slug.md`
Required sections: **Status · Context · Decision · Consequences**

Status vocabulary: `Proposed` → `Accepted` → `Superseded by [[ADR-XXX]]` → `Deprecated`

> **Rule of thumb:** If a decision is active guidance ("always do X, never do Y"), it belongs in `Rules/`. If it's a one-time choice with historical value (library picked, pattern adopted), it's an ADR.

### D. Journals — Session Memory

One file per dev session: `YYYY-MM-DD-short-slug.md`. Written at end of session via:

> `claude "Summarize our progress into a markdown file for the Obsidian Journal."`

Captures: **What shipped · Unresolved bugs · Edge cases · Next steps**.

### E. Library — Cross-Project Knowledge

Anything that outlives a single project:

- **Patterns**: Repository Pattern, IPC Handler Pattern, …
- **Boilerplates**: Code snippets ready to paste
- **Lessons-Learned**: "That weird SQLite error that cost me 2 hours" — future Claude finds the fix in seconds

### F. LLM-Config — Swappable Personas

Keep persona variants here so Claude can load a specific mode:

> `claude "Load [[Security Auditor Persona]] and review this auth flow."`

### G. Workflows — Repeatable Checklists

Markdown checklists Claude runs top-to-bottom for routine ops: starting a session, ending a session, shipping a feature, triaging a bug.

## 4. Integration Workflow (Claude Code ⇄ Obsidian)

### Strategy: **Vault-Inside-Repo**

The vault lives at `./Brain/` inside the repo root. Claude sees docs alongside `src/`, you see them in a pretty Obsidian UI.

```text
QA-Workspace-Management-App/           ← git repo root
├── src/                               ← code
├── CLAUDE.md                          ← auto-loaded by Claude Code; points at Brain/
├── .claude/                           ← Claude Code settings (no longer holds rules)
└── Brain/                             ← THIS OBSIDIAN VAULT
    ├── Architecture.md                ← this file
    ├── Welcome.md
    └── QA-Workspace-Management-App/
        ├── Rules/                     ← authoritative project rules
        ├── ADR/
        ├── Context/
        ├── Journals/
        └── ...
```

The `Brain/` name signals "this is Claude's knowledge base." Opening `Brain/` as an Obsidian vault gives a rich navigation UI over the same files Claude reads from disk.

## 5. The Karpathy Loop — Compounding Returns

Three small habits that turn this vault from notes into an accelerator:

1. **The Indexer** — `QA-Workspace-Management-App/Context/file-map.md` lists every significant file + its purpose. Regenerate after major refactors.
2. **The Error Log** — Every bug that takes > 30 min gets a `Library/Lessons-Learned/<bug>.md`. Claude checks this folder first when diagnosing.
3. **The Persona Vault** — `LLM-Config/System-Prompts/` lets you swap mindsets without re-explaining every session.

## 6. How Claude Should Use This Vault

**Session start** — follow [[session-start-workflow]]:

1. Read the project Context Map (`[[QA-Workspace-Management-App-Context]]`)
2. Skim recent journals in `QA-Workspace-Management-App/Journals/` (last 1–2 entries)
3. Spot-check `QA-Workspace-Management-App/Rules/` for rules touching the current task
4. Check `QA-Workspace-Management-App/ADR/` for `Accepted` decisions relevant to the task

**Before suggesting a library / pattern** — consult the relevant rule file and grep `ADR/` for prior decisions. If a rule or ADR rejects it, follow the recorded alternative.

**Before diagnosing a bug** — search `Library/Lessons-Learned/` for the error signature.

**Session end** — follow [[session-end-workflow]]:

1. Write a new journal in `QA-Workspace-Management-App/Journals/`
2. If a one-time decision was made, create an ADR
3. If a bug took > 30 min, write a Lesson-Learned
4. If the decision is an ongoing rule (not a one-off), update the relevant `Rules/*.md`

**Memory is non-negotiable** — Claude's session context is ephemeral; this vault is durable. Read before acting, write before leaving.

## 7. Quick Links

- Current project: [[QA-Workspace-Management-App-Context]]
- Session start: [[session-start-workflow]]
- Session end: [[session-end-workflow]]
- Create a new ADR: copy [[ADR-template]]
- New journal entry: copy [[Journal-template]]
- Bootstrap a new project: copy [[Context-Map-template]]

## 8. Maintenance

- Review `Architecture.md` quarterly; update `last_reviewed` in frontmatter.
- Keep the vault **lean**: if a note isn't being read by Claude or you, delete it.
- ADRs are append-only — never edit an `Accepted` ADR; supersede it with a new one.
- Rules evolve — edit them in place; the git history preserves older versions.

### Structural Sync Rule (mandatory)

**Any time a folder or file is added, moved, renamed, or deleted — update these docs in the same operation, before closing the task:**

| What changed | Documents to update |
|---|---|
| `Brain/` vault structure (new folder, renamed path, moved file) | `Brain/Architecture.md` §2 + §4 diagrams |
| `Brain/QA-Workspace-Management-App/Rules/` (file added or removed) | `Brain/QA-Workspace-Management-App/QA-Workspace-Management-App-Context.md` Rules section · `CLAUDE.md` Rules table |
| `src/` directory structure (new folder, moved file, renamed module) | `Brain/QA-Workspace-Management-App/Rules/project-structure.md` Directory Structure tree · `Brain/QA-Workspace-Management-App/Context/file-map.md` per-file table |
| Repo root layout change (new top-level folder, renamed entry point) | `Brain/Architecture.md` §4 repo diagram · `CLAUDE.md` Quick Start / Stack sections |

> **Failing to sync these docs will cause Claude to misread the project structure on the next session start.** Treat stale diagrams the same as a failing test — don't leave the session without fixing them.

### Link Cleanup Rule (mandatory on deletion)

Obsidian's Graph View shows every `[[wikilink]]` as a live edge. A deleted file with surviving references leaves broken (orphan) nodes in the graph and silently misleads navigation.

**Before deleting any vault file:**

1. Find all references to it:
   ```bash
   grep -r "filename-without-extension" Brain/ --include="*.md" -l
   ```
2. Open each file that matched and remove or replace:
   - `[[filename]]` wikilinks (inline text and Quick Links sections)
   - `[[filename|display text]]` aliased links
   - Table rows that list the file (e.g. ADR index tables, Context README lists, CLAUDE.md Rules table)
3. Delete the file only after all references are gone.

> One grep before the delete keeps the Graph View clean and prevents the next session from following a dead link.
