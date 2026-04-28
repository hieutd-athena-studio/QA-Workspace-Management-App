---
title: Deadline Health, Task Budget, Dashboard, Project Color
date: 2026-04-28
session: re-work-test-plan (batch 2 + 3)
---

# 2026-04-28 — Deadline Health, Task Budget, Dashboard, Project Color

## What Shipped

### Feature: Test Plan Health Indicator
- `getDeadlineStatus(endDate, summary?)` now accepts task summary. If all tasks done + not overdue → forced `'safe'` (green).
- Plan cards in `TestPlansPage` show colored left border via `.plan-card--safe/warning/critical/overdue` classes.
- Progress bar uses task-completion % when tasks exist, falls back to calendar % when no tasks.

### Feature: Per-Task Working Days Budget
- Task structure extended: `{text, done, days?: number}`.
- `calculateWorkingDaysBetween(start, end)` added to `working-days.ts` — counts working days inclusive between two specific dates (Vietnamese holiday-aware).
- `getTotalTaskDays(summary)` sums all `task.days` values.
- Edit mode in `TestPlanDetailPage` shows `<input type="number">` per task row.
- Amber warning banner appears when total task days > plan working-day budget.

### Feature: Dashboard Page
- `/dashboard` route — `DashboardPage.tsx`.
- Fetches all projects + all plans. Groups plans by project. Sorts worst → best health.
- `calculateProjectHealth(plans)` in `src/shared/utils/dashboard.ts` — healthy plan = 100% tasks done + not past end_date.
- Health thresholds: green ≥ 80%, amber 40–79%, red < 40%.
- Sidebar: Gantt removed, Dashboard added (always visible, not project-gated).
- Root `/` now redirects to `/dashboard`.

### Feature: Project Card Color
- Migration 008 adds `color TEXT` column to `project` table (PRAGMA guard — safe to re-run).
- `Project`, `CreateProjectDTO`, `UpdateProjectDTO` types updated.
- `project.repo.ts` — INSERT + UPDATE include `color`.
- `ProjectsPage` form: HTML color picker + Reset button.
- Card: `--project-accent` CSS custom property on inline style.
- CSS fix: `.project-card:hover` and `.project-card-active` used `border-color` shorthand which overwrote `border-left`. Fixed by adding explicit `border-left-color: var(--project-accent, var(--primary))` after the shorthand.

### Tests
- `working-days.test.ts` — 20 tests including `calculateWorkingDaysBetween` + `getTotalTaskDays`.
  - Watch out: Apr 27 2026 = Vietnamese Hung Kings holiday. Test dates shifted to May 4–5.
- `dashboard.test.ts` — 5 tests for `calculateProjectHealth`.

## Key Decisions

- Task `days` field optional + backward compatible. Old tasks without it contribute 0 to budget sum.
- Dashboard reuses existing `testPlans.getAll()` IPC (no new backend handler needed — already returned all plans project-wide).
- CSS custom property approach for per-card accent color allows any child selector to pick up the color without per-element style overrides.

## Unresolved / Next Steps

- None critical. Color picker shows native OS color dialog (varies by OS) — acceptable.
- Dashboard does not paginate — fine for single-user app with typical project count.
- `TestPlanDetailPage` edit-plan modal lacks validation feedback (empty name saves silently) — potential polish item.

## Follow-ups for Claude

- `border-color` shorthand resets `border-left` in CSS. Always add `border-left-color` after `border-color` when per-side custom colors are used.
- Vietnamese holidays in `VN_HOLIDAYS` set cover 2025–2027 only. If app used past 2027, extend the set.
- `calculateWorkingDaysBetween` is inclusive on both ends. Budget = days you have including start and end day.
