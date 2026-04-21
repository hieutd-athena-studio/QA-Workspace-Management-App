# Git Workflow & Build

## Git Workflow

- **Atomic commits:** One feature = one commit (unless splitting for clarity)
- **Commit messages:** Feature-focused, reference files changed
- **No force pushes** to main
- **PR reviews:** Code follows project standards

## Build & Performance

- **Main bundle target:** < 100kB
- **Renderer CSS target:** < 100kB per page
- **Lazy load:** Pages load on route, not upfront
- **Tree-shake:** Export only what's used; remove unused re-exports

## Fork PR Automation

If working in a **fork** of this repo, use the session-end automation to submit work back to upstream:

**End of session — Run once:**
```powershell
# Windows
.\.claude\fork-pr-submit.ps1
```
```bash
# macOS/Linux
bash .claude/fork-pr-submit.sh
```

This:
- Verifies upstream remote exists
- Commits all changes (`Session work: YYYY-MM-DD`)
- Pushes to your fork origin
- Creates a PR to upstream `main`

**Requires:** GitHub CLI (`gh`) installed + authenticated

See [[session-end-workflow]] step 7 for full details.

## Dev Commands

```bash
npm run dev       # Start electron-vite dev server (hot reload)
npm run build     # Build for distribution
npm run preview   # Preview built app locally
npm install       # Install deps + electron-builder setup
```
