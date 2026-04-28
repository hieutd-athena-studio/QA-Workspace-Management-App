---
title: ADRs — QA-Workspace-Management-App
type: index
---

# Architecture Decision Records

> Append-only log of non-trivial decisions **that aren't already codified in `Rules/`**. Prevents Claude from re-suggesting rejected patterns.

## When to write an ADR vs. update a Rule

- **Active guidance** ("always do X, never do Y") → update the relevant `Rules/*.md` file.
- **One-time choice with historical value** (library picked, pattern adopted, schema redesigned) → write an ADR here.

If a decision becomes ongoing enforcement, promote it to a `Rules/` file and deprecate or supersede the ADR.

## File format

`ADR-NNN-short-slug.md` — three-digit zero-padded, kebab-case slug.

Required frontmatter:

```yaml
---
id: ADR-NNN
title: Short title
status: Proposed | Accepted | Superseded | Deprecated
date: YYYY-MM-DD
supersedes: ADR-XXX   # optional
superseded_by: ADR-XXX # set when a later ADR replaces this one
---
```

Required sections: **Context · Decision · Consequences**. See [[ADR-template]].

## Status semantics

- **Proposed** — under discussion, not yet binding
- **Accepted** — Claude MUST follow this
- **Superseded** — outdated; `superseded_by` points to the replacement
- **Deprecated** — no longer relevant; keep for history

## Current ADRs

| ID | Title | Status |
|----|-------|--------|
| [[ADR-004-react-context-over-redux]] | React Context for app-level state (no Redux) | Accepted |
| [[ADR-005-task-list-json-storage]] | Task list stored as JSON in summary column | Accepted |

## Adding a new ADR

1. Pick next number (e.g. `ADR-005`).
2. Copy `Templates/ADR-template.md` → `ADR-005-your-slug.md`.
3. Write Context · Decision · Consequences.
4. Set `status: Proposed` while discussing; flip to `Accepted` when agreed.
5. Add a row to the table above.
