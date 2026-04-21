---
title: Journals — QA-Workspace-Management-App
type: index
---

# Journals

One markdown file per dev session. This is Claude's **session memory** — the file written at the end of a session so the next session can pick up cold.

## File format

`YYYY-MM-DD-short-slug.md` — date first for chronological sort.

Frontmatter:

```yaml
---
date: 2026-04-20
session_type: feature | bugfix | refactor | research | planning
participants: [you, claude]
related_specs: [[spec-slug]]
related_adrs: [[ADR-NNN-slug]]
---
```

Use [[Journal-template]] as the starting structure.

## End-of-session command

> `claude "Summarize our progress into a markdown file for the Obsidian Journal following [[Journal-template]]."`

## Recent entries

- [[2026-04-20-vault-initialized]] — Bootstrapped the Obsidian Dev-Brain
