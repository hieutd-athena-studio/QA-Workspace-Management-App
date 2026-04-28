# 2026-04-28: Test Plan Task List Implementation

## What Shipped

Replaced test plan "Summary" field with interactive **task list** (checklist):
- Plan detail page: checkbox tasks, toggle done state, strikethrough completed items
- Creation form: textarea input for initial tasks (newline-separated), empty → empty array
- Removed summary textarea from creation form
- Tasks stored as JSON `[{text, done}]` in existing `summary` TEXT column (no migration needed)

## Changes Made

### TestPlanDetailPage.tsx
- Replaced `summaryDraft` state with `tasksDraft: {text, done}[]`
- Added `parseTasks()` → parse JSON from summary field, fallback empty array
- Added `handleToggleTask()` → toggle done state, immediate save
- Render view: checkbox list with strikethrough for done
- Render edit: add/remove/rename tasks inline

### TestPlansPage.tsx
- Removed `summary` state
- Added `taskList` state (newline-separated text)
- Updated `handleCreate()` → parse taskList into task objects, JSON.stringify
- Added textarea field "Initial Tasks (one per line)" to form
- Removed summary textarea from form
- Removed summary display from plan cards

### TestPlanDetailPage.css
- Added `.task-list-view` → flex column, gap
- Added `.task-item` → checkbox with label, cursor pointer
- Added `.task-item--done span` → strikethrough + dimmed color
- Added `.task-list-edit` → task input rows
- Added `.task-edit-row` → input + remove button
- Added `.task-edit-input` → flex 1
- Added `.task-edit-remove` → red color button

## Key Decisions

- **Storage**: Reuse `summary` TEXT column, store JSON. No schema change. Backward compatible (legacy text won't parse, returns empty array).
- **Format**: Newline-separated in creation form for UX simplicity. Parsed → JSON array on save.
- **Immediate save**: Toggle done state saves instantly. Edit mode batch saves.

## Unresolved / Follow-ups

None identified.

## Testing Notes

- Creation: add plan with tasks → verify tasks appear in detail view
- Detail view: check/uncheck items → verify strikethrough + done state persists
- Empty creation: no tasks → empty array stored, "No tasks yet" message shown
- Edit mode: add/remove/rename → Save batches all changes
