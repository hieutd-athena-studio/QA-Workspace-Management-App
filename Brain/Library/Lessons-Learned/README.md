---
title: Lessons-Learned
type: index
---

# Lessons-Learned

Post-mortems for bugs that took **> 30 minutes**. This is the folder Claude should grep **first** when diagnosing an error signature.

## How to add

Copy [[Lesson-Learned-template]] → `<short-slug>.md`. Always include the **exact error signature** (message, stack-trace line, symptom) so grep hits it.

## Indexing hint

The frontmatter `tags:` field is how patterns emerge. Use stable tags:

- Framework tags: `electron`, `react`, `better-sqlite3`, `vite`, `typescript`
- Category tags: `ipc`, `migration`, `build`, `csv`, `type-error`, `race-condition`

## Current entries

_Empty. The first entry should appear after the first real debugging session._
