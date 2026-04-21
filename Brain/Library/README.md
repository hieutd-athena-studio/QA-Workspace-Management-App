---
title: Library — Cross-Project Knowledge
type: index
---

# Library

Knowledge that outlives a single project. Referenced from multiple Context Maps.

## Sub-folders

- [[Library/Patterns/README|Patterns]] — reusable design patterns (Repository, IPC Handler, Display ID generation, …)
- [[Library/Boilerplates/README|Boilerplates]] — copy-paste code snippets
- [[Library/Lessons-Learned/README|Lessons-Learned]] — post-mortems / weird-bug writeups (grep-first target when diagnosing)

## When to promote content here

- A pattern appears in **two or more** projects → lift into `Patterns/`
- A code snippet is pasted **three or more** times → turn into a `Boilerplate`
- A bug took **> 30 minutes** to diagnose → always write a `Lesson-Learned`

## When to extract back to a project

If a Library item becomes project-specific (e.g. a pattern with a critical tweak only one project needs), move it back to that project's `Context/` or `ADR/` folder.
