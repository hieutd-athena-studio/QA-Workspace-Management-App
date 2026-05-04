---
date: 2026-05-04
session_type: feature+dx
participants: [user, claude]
---

# 2026-05-04 — Project Cards Bigger + Test Types Count Display

## What shipped

- **ProjectsPage.css** — Cards bigger
  - Grid: `minmax(300px → 400px)` — wider cards
  - Padding: `var(--sp-6) → var(--sp-8)` — more internal space
  - Added `min-height: 280px`

- **TestTypesPage.tsx — ManageCasesModal** — Count display
  - Added `allTestCases: Map<number, TestCase[]>` state
  - On modal open: preloads all test cases for all subcategories via `useEffect`
  - Category button label: `"All"/"Selected"` → `"selected/total"` (e.g. `"3/10"`)
  - Subcategory button label: `"Select All"/"Deselect All"` → `"2/5 (select all)"` / `"2/5 (deselect all)"`
  - Added `getCountsForCat(catId)` and `getCountsForSub(subId)` helpers

## Key decisions

- Preload all subcategory test cases on modal open (not lazy) — gives accurate counts immediately
- Category counts derived from `allTestCases` map; subcategory counts fallback to `testCases` for current sub

## Unresolved / next steps

- DashboardPage.tsx:38 has pre-existing crash (unrelated to this session, all other pages work)
- TestTypesPage category count shows `0/total` until subcategory is clicked if that sub's cases aren't in the map yet

## Follow-ups for Claude

- DashboardPage error is PRE-EXISTING. Do not diagnose unless user explicitly asks.
- TestTypesPage.ManageCasesModal now preloads all cases — if performance is slow on large projects, consider lazy loading.
- `getCountsForCat()` relies on `allTestCases` being populated. On first render, category counts show `0/total` until `loadAllCases` effect resolves.
