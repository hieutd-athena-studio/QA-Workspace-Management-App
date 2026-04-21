---
title: <Bug / issue short name>
type: lesson-learned
date: <YYYY-MM-DD>
project: <ProjectName>
severity: minor | moderate | major
time_lost: <e.g. 2h>
tags: [<tech>, <error-type>]
---

# <Bug / issue short name>

## Symptom

<What did you / the user see? Exact error message, stack trace excerpt, or observed misbehaviour. Include version numbers.>

```text
<paste the actual error signature here so future grep hits it>
```

## Root cause

<What was actually wrong, explained once you understood it. Not the dead-ends; the real cause.>

## Fix

<The change that resolved it. File paths + diff summary, not a full rewrite.>

## How to detect it next time

<A grep pattern, a specific symptom, or a reproduction step. This is what makes the lesson "learned" — the next occurrence should take minutes, not hours.>

## Prevention

<Optional. What guardrail (test, lint rule, ADR, review checklist item) would catch this earlier? If nothing exists yet, consider adding one.>
