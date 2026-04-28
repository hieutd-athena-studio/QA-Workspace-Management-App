---
id: ADR-005
title: Task list stored as JSON in summary TEXT column (no schema change)
status: Accepted
date: 2026-04-28
tags: [data-model, test-plans, database]
---

# ADR-005 · Task list stored as JSON in summary TEXT column

## Context

Test plan previously had a free-form `summary` TEXT field for narrative description. Shift to actionable task list (checklist) for test planning requires storing structured `{text, done}[]` data.

Options:
- **New table** `test_plan_tasks` — normalized, clean schema, requires migration
- **JSON in existing column** — reuse `summary` TEXT column, store `[{text, done}]`
- **Separate JSON column** — new column `tasks`, JSON type (if supported by SQLite)

## Decision

Use **JSON array in existing `summary` TEXT column**:

```typescript
// Storage format
[
  { text: "Login flow", done: false },
  { text: "Payment processing", done: true }
]
```

Rules:
- Parse with `JSON.parse()` (safe — user-provided, not untrusted input)
- Fallback to `[]` if parse fails (legacy plain text ignored)
- Save with `JSON.stringify(tasksDraft)`
- No DB migration needed — TEXT column accepts JSON strings

## Rationale

- **Zero migration risk** — no schema change, backward compatible
- **Simplicity** — one column, one table, no joins
- **Backward compat** — legacy text summaries safely ignored (parse fails → empty array)
- **Future-proof** — if SQLite gets JSON functions, can migrate later with a script

## Consequences

**Positive**
- No downtime, no migration story
- One place to edit tasks (no N+1 queries)
- Task state toggle immediate save (no form overhead)

**Negative**
- JSON parsing on every read (negligible perf cost)
- Lose full-text search on task text (if ever needed, migrate to tasks table)
- Manual validation (no schema constraint on array shape)

**Follow-ups**
- If task text search becomes critical, migrate to normalized table + keep summary for legacy
- If tasks outgrow simple checklist (subtasks, assignees, etc.), revisit schema
