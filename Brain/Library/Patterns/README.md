---
title: Patterns
type: index
---

# Patterns

Reusable design patterns Claude should consider before hand-rolling a solution.

## How to add

1. Confirm the pattern is used in **at least two** projects.
2. Copy `Templates/` shape (if you create a pattern template) or use the structure below:

```markdown
# <Pattern name>

## When to use
## How it works (high level)
## Reference implementation
- File path(s) where this exists in production
## Variants / trade-offs
```

3. Link from the relevant project Context Map(s).

## Current patterns

_Seed the list as patterns are extracted. Early candidates from `QA-Workspace-Management-App`:_

- **IPC Handler Pattern** — `wrapError(async (_, dto) => { ... return wrapSuccess(...) })`
- **Repository Pattern** — one class per entity with prepared statements + display-ID generation
- **Invalidation Pattern** — `invalidate("<domain>")` post-mutation

Promote these into full pattern files once a second project also uses them.
