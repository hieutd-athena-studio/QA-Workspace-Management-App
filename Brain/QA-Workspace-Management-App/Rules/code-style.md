# Code Style

## TypeScript

- **Strictness:** No `any`. Use `unknown` for unsafe boundaries.
- **Shared Types:** Single source of truth in `src/shared/types/`. Split by domain.
- **Type vs Interface:** `interface` for public APIs/Props. `type` for unions, DTOs, discriminated unions.
- **No Cross-Process Leaks:** Types are shared; implementations are not. IPC handlers translate.

## Component Rules

- **Arrow Functions Only:** `const Component = () => {}`
- **Keep < 100 lines:** Extract logic into custom hooks
- **Early Returns:** Minimize nesting
- **No Inline Styles:** Use CSS files. Split `.css` per component.
- **Props Interface:** One `interface Props { ... }` at top of file
- **No Default Exports from Folders:** Import from exact file paths

## File Structure

```
src/renderer/
├── components/
│   ├── category-panel/
│   │   ├── CategoryPanel.tsx
│   │   └── CategoryPanel.css
│   ├── test-cases/
│   │   ├── TestCaseForm.tsx / .css
│   │   └── TestCaseList.tsx
│   └── shared/
│       └── ConfirmDialog.tsx
└── pages/
    ├── TestLibraryPage.tsx
    └── TestLibraryPage.css
```

## Modal/Overlay Pattern

Use shared `tcf-*` CSS classes:

```css
.tcf-overlay { /* darkened background */ }
.tcf-modal   { /* centered dialog */ }
.tcf-label   { /* form labels */ }
.tcf-footer  { /* button row */ }
```

## CSS Organization

- **One `.css` file per component.** No CSS-in-JS, no Tailwind.
- **Design Tokens:** `src/renderer/assets/styles/global.css` (single file)
  - `:root` block: all CSS custom properties — colors, spacing, radii, typography
  - Colors: `--primary`, `--critical`, `--success`, etc.
  - Spacing: `--sp-1` through `--sp-16` (4px base grid)
  - Shared classes: `.btn`, `.btn-primary`, `.btn-secondary`, `.data-table`, `.no-project-guard`
  - Typography: `.text-muted`, `.body-sm`, `.label-md`

## Class Naming

- **BEM-light:** `.component-name` parent, `.component-name-child` children
- **Status:** `.status-passed`, `.status-failed`, `.status-blocked`, `.status-pending`
- **State:** `.active`, `.disabled`, `.loading`
- **Utility:** `.text-muted`, `.mono`, `.secondary`

## Why this rule exists (CSS per component)

Three common approaches to styling React apps were considered:

1. **Tailwind / utility CSS** — class-name heavy markup, tooling dependency.
2. **CSS-in-JS** (styled-components, Emotion) — runtime cost, SSR complications.
3. **Plain CSS files, one per component** — zero runtime cost, zero toolchain surprise.

This project is a local Electron app — no SSR, no hydration, no design-agency branding refresh every quarter. The primary non-functional goals are:

- Keep the renderer bundle small (target: CSS < 100 kB per page).
- Keep build config boring (electron-vite + Vite only; no PostCSS plugins).
- Keep diffs readable (class lists in JSX don't drift ten-wide).

Approach #3 wins on all three counts.

**Benefits:**

- Fastest possible iteration loop — edit CSS, see change, no build step.
- Designers can grep the codebase for a token and find all usages.
- No "why doesn't this class work" debugging (Tailwind purge, specificity wars).

**Tradeoff:** Slightly more boilerplate per new component (two files instead of one). No compile-time guarantee that a `className` exists — mitigated by keeping components small and CSS colocated.

## Response Mode (AI)

- Be concise, no preambles
- Show diffs only — don't rewrite entire files unless major refactor
- Don't re-read files unless context has changed
- Parallel read when analyzing multiple related files
- Use Grep for large codebase searches
