# Open Questions

## qa-workspace-app - 2026-03-30

- [ ] **Electron version pinning** -- Should we pin to a specific Electron major (e.g., 28.x) or use latest stable? Affects native module compatibility with better-sqlite3.
- [ ] **Test case steps format** -- Should `steps` be stored as plain text (one step per line) or as a JSON array of structured step objects (step number, action, expected)? Plain text is simpler; JSON enables richer step-by-step execution UI.
- [ ] **Gantt chart date granularity** -- Auto-scale between day/week/month views, or fixed to one granularity? Spec says read-only, but granularity affects usability for plans spanning weeks vs. months.
- [ ] **Report template customization** -- Should the HTML report template be hardcoded or allow future theming? Hardcoded is simpler and within spec; a template file would allow customization later.
- [ ] **Database backup/export** -- No spec requirement, but should we expose a "Backup Database" option in the File menu as a low-effort safety feature? (Just copies the .sqlite file via dialog.showSaveDialog.)
- [ ] **Packaging and distribution** -- electron-builder vs electron-forge for creating distributable installers. Deferred to a future plan but worth deciding before Phase 6 concludes.
