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

## Dev Commands

```bash
npm run dev       # Start electron-vite dev server (hot reload)
npm run build     # Build for distribution
npm run preview   # Preview built app locally
npm install       # Install deps + electron-builder setup
```
