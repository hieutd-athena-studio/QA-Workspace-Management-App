---
title: System-Prompts — Personas
type: index
---

# System-Prompts — Personas

Swappable Claude personas. Each file is a self-contained set of instructions that Claude should obey for the session.

## Available

- [[default-claude-persona]] — the standard engineering persona for this vault

## Structure

```markdown
---
title: <persona name>
scope: <when to use this persona>
---

# <Persona Name>

## Role
## Priorities (in order)
## Tone
## Non-negotiables (carried from `CLAUDE.md`)
## Toolbox (preferred tools / skills)
```

## Authority

Personas **never** override `CLAUDE.md` or the project Rules folder. They can:

- Narrow focus (e.g. "only auth concerns today")
- Change tone (e.g. "review-mode: blunter")
- Reprioritize (e.g. "perf first, ergonomics second")

They cannot:

- Contradict a rule
- Lift a guardrail (e.g. "allow `--no-verify`")
