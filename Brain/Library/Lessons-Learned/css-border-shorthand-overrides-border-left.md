---
title: CSS border-color shorthand overrides border-left custom color
date: 2026-04-28
error_signature: "CSS custom property on border-left-color not reflected in rendered card"
---

# CSS `border-color` shorthand overrides `border-left` custom color

## Error Signature

Project card custom accent color set via `--project-accent` CSS variable appears to have no effect. Card always shows `--primary` blue on hover or when active, ignoring the inline style.

## Root Cause

`border-color` is a shorthand that sets **all four border colors** simultaneously. When used in `:hover` or an active class:

```css
.project-card:hover {
  border-color: var(--primary); /* resets ALL sides including left */
}
```

This wipes the `border-left: 4px solid var(--project-accent)` override set on the base `.project-card` rule.

## Fix

Add explicit `border-left-color` **after** the shorthand in every rule that uses `border-color`:

```css
.project-card:hover {
  border-color: var(--primary);
  border-left-color: var(--project-accent, var(--primary)); /* restore */
}

.project-card-active {
  border-color: var(--primary);
  border-left-color: var(--project-accent, var(--primary)); /* restore */
}
```

## Detection Heuristic

Whenever a per-side border custom property (e.g., `border-left-color`, `border-top-color`) is set on an element, search all CSS rules that also target that element for `border-color` or `border` shorthand usage. Any such shorthand is a silent override.
