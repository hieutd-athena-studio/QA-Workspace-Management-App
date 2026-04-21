---
id: ADR-004
title: React Context for app-level state (no Redux)
status: Accepted
date: 2026-04-20
tags: [state-management, react, frontend]
---

# ADR-004 · React Context for app-level state (no Redux)

## Context

State-management options considered:

- **Redux / Redux Toolkit** — industry standard, powerful devtools, significant boilerplate
- **Zustand / Jotai** — minimal, but another dependency with its own patterns
- **React Context + `useState` / `useReducer`** — built in, zero dependency, "good enough" for medium apps

This is a single-user local app with a small state surface:

- Selected project (persisted to localStorage)
- Notification/toast stack
- Cache-invalidation domain flags
- Category-panel selection

High-frequency state (scroll position, mouse coords, form-input values) stays local to components.

## Decision

Use **React Context only**, split by domain:

- `ProjectContext` — selected project; persists to localStorage
- `NotificationContext` — toast stack
- `InvalidationContext` — per-domain cache invalidation signals (`invalidate("testCases")`)
- `CategoryPanel` — category / subcategory selection

Rules:

- **Use Context for**: selected items, app-level settings, cache-invalidation signals
- **Don't use Context for**: high-frequency updates (scroll, mouse), deeply nested prop drilling (prefer composition)
- **Data fetching** goes through a custom hook: `useApi<T>(fetcher, deps, cacheKey)` in `src/renderer/hooks/useApi.ts`
- **After any mutation** (create/update/delete), call `invalidate("<domain>")` to refresh dependent queries

**No Redux. No Zustand. No MobX. No Recoil.** If Context ever genuinely stops scaling, write a new ADR that supersedes this one.

## Consequences

**Positive**
- Zero dependency cost, zero tooling surprise
- Every state change is a normal React render — no selectors, no middleware
- Invalidation pattern is explicit and greppable (`invalidate("testCases")`)

**Negative**
- No devtools for time-travel debugging — acceptable at this app's complexity
- Care needed to avoid over-broad context that re-renders everything (split by domain as above)

**Follow-ups**
- `useApi` hook doubles as a thin cache; see [[api-conventions]] for the call sites
