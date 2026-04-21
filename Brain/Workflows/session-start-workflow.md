---
title: Session Start Workflow
type: workflow
---

# Session Start Workflow

Run this at the beginning of every coding session.

## 1. Identify the project

Which project is the user asking about? Default for this repo: **QA-Workspace-Management-App**.

## 2. Load the Context Map

Read the project's Home Base. For this repo:

> Read [[QA-Workspace-Management-App-Context]].

Note the **Don't / Do** section and the **ADR index** — these are the guardrails for the session.

## 3. Skim recent journals

Open the `Projects/<Project>/Journals/` folder and read the **last 1–2 entries**. Look for:

- Unresolved items from last session → they might be today's work
- "Follow-ups for Claude" sections → carry forward behaviour

## 4. Spot-check ADRs relevant to the ask

If the user's request touches a domain with an ADR (state management → ADR-004, styling → ADR-003, DB schema → ADR-002, IPC → ADR-001), **re-read that ADR** before suggesting anything.

## 5. Check Lessons-Learned for error signatures

If the user opens with an error message, grep `Library/Lessons-Learned/` for the signature before diagnosing from scratch.

## 6. Cross-check with the Rules folder

The authoritative rule set lives in `QA-Workspace-Management-App/Rules/` inside this vault. `CLAUDE.md` at the repo root is the top-level index that auto-loads each session; it points back here. If anything in the Context Map, ADRs, or journals appears to contradict a rule, **the rule wins** — and the out-of-date document should be updated.

## 7. Confirm scope with the user (only if ambiguous)

Auto-mode sessions should proceed without asking. If scope is ambiguous or the ask is destructive, confirm first.
