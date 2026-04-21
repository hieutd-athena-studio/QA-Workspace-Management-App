---
title: Workflows
type: index
---

# Workflows

Repeatable checklists Claude runs top-to-bottom for routine ops.

## Core

- [[session-start-workflow]] — first thing to do when opening a session
- [[session-end-workflow]] — before closing a session, write memory
- [[new-feature-workflow]] — checklist for shipping a feature end-to-end

## When to add one

If you (or Claude) notice the same sequence of steps being repeated across sessions, turn it into a workflow here. Workflows should be:

- **Concrete** — named commands / file paths, not "think about X"
- **Linear** — a numbered list, top to bottom
- **Short** — if it's > 15 steps, split it
