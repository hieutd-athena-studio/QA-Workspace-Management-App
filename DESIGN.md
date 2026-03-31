# Design System: The Operator Console (Dark)

## Creative Direction

A professional desktop workspace for QA engineers. Full dark theme — the sidebar palette extends across the entire interface. Deep navy surfaces, muted slate text, single electric-blue accent. No bright whites, no harsh contrasts. The screen should feel like a cockpit: comfortable for long sessions, purposeful, calm.

**Aesthetic reference:** Linear, Raycast, Warp terminal — tools built for people who live in them.

---

## 1. Typography

**Primary UI:** `Plus Jakarta Sans` — geometric, modern, distinct  
**Monospace:** `JetBrains Mono` — IDs, display codes, step numbers, badges

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```

### Scale

| Token class | Size | Weight | Use |
|-------------|------|--------|-----|
| `.display-sm` | 2rem | 700 | Hero numbers |
| `.headline-sm` | 1.5rem | 600 | Major headers |
| `.title-sm` | 1rem | 600 | Card/section titles |
| `.body-md` | 0.875rem | 400 | Primary body (workhorse) |
| `.body-sm` | 0.8125rem | 400 | Secondary data |
| `.label-md` | 0.75rem | 600 caps | Table headers |
| `.label-sm` | 0.6875rem | 700 caps | Badges, status labels |
| `.mono` | 0.8125rem | 400 | IDs, codes |

---

## 2. Color System (Dark Palette)

The sidebar (`#0d1117`) is the darkest layer. Content areas step up in brightness, maintaining the same navy-slate family throughout.

### Surface Hierarchy (darkest → raised)

| Token | Value | Use |
|-------|-------|-----|
| `--sidebar-bg` | `#0d1117` | Sidebar — deepest layer |
| `--surface-container-low` | `#0d1320` | Input fields, table panel bg |
| `--surface` | `#111827` | Main content background |
| `--surface-container-lowest` | `#1a2337` | Cards, modals, panels |
| `--surface-container-highest` | `#1e2a40` | Elevated panels, tooltips |

### Text

| Token | Value | Use |
|-------|-------|-----|
| `--on-surface` | `#dde6f5` | Primary text |
| `--on-surface-variant` | `#8896b3` | Secondary / muted text |
| `--outline-variant` | `rgba(136,150,179,0.2)` | Subtle dividers (data tables only) |

### Accent (Single)

| Token | Value | Use |
|-------|-------|-----|
| `--primary` | `#3b82f6` | Active states, CTAs, links |
| `--primary-dim` | `#2563eb` | Hover state on accent |
| `--on-primary` | `#ffffff` | Text on accent bg |

### Semantic (Muted for dark bg)

| Token | Value | Use |
|-------|-------|-----|
| `--success` | `#34d399` | Pass, active, on-going |
| `--warning` | `#fbbf24` | Blocked, on-hold |
| `--critical` | `#f87171` | Fail, delete, dropped |

---

## 3. Rules

### The Dark Continuity Rule
The sidebar palette extends to all surfaces. No white backgrounds. No light grey. Every surface uses the `--surface-*` dark tokens.

### The Single Accent Rule
One blue (`--primary`). Used for: active nav indicator, focus rings, primary buttons, links. Nowhere else.

### No-Border Rule
Use background color shifts to separate sections. For data tables only, use `rgba(136,150,179,0.06)` row separators.

### Shadow Policy
Shadows are deeper on dark themes. Only for floating elements.
```
--shadow-float: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)
```

### Spacing Scale (4px base)
`--sp-1: 4px` | `--sp-2: 8px` | `--sp-3: 12px` | `--sp-4: 16px` | `--sp-5: 20px` | `--sp-6: 24px` | `--sp-8: 32px` | `--sp-10: 40px` | `--sp-12: 48px` | `--sp-16: 64px`

### Radius Scale
- `--radius-sm: 4px` — chips, badges
- `--radius-default: 6px` — buttons, inputs, rows
- `--radius-lg: 10px` — cards, panels, picker panes
- `--radius-xl: 16px` — modals, large overlays

---

## 4. Components

### Sidebar
- Background: `--sidebar-bg` (`#0d1117`)
- Active link: left 3px blue bar + `--sidebar-active-bg`
- Icon + label always together (SVG icons, never emoji)
- Project chip: `--font-mono` code badge + name

### Buttons
- **Primary:** gradient `--primary → --primary-dim`, white text
- **Secondary:** `rgba(255,255,255,0.05)` bg, muted border
- **Danger:** `rgba(248,113,113,0.15)` bg, `--critical` text + border
- **Ghost:** transparent, muted text, no border

### Inputs / Textareas
- Background: `--surface-container-low` (`#0d1320`)
- Border: `rgba(136,150,179,0.15)` transparent until focus
- Focus: `--primary` border + `rgba(59,130,246,0.15)` glow

### Data Tables
- Header: 11px uppercase, `--on-surface-variant`
- Row separators: `rgba(136,150,179,0.06)` (barely visible)
- Row hover: `rgba(255,255,255,0.03)` (very subtle lift)
- ID column: `--font-mono`

### Modals
- Overlay: `rgba(0,0,0,0.65)` + `backdrop-filter: blur(24px)`
- Panel: `--surface-container-lowest` + subtle border
- Animation: fade + slideUp (200ms)

### Status Badges
Left-border accent, tinted background:
- Pass: `#34d399` (emerald)
- Fail: `#f87171` (rose)
- Blocked: `#fbbf24` (amber)
- Pending: `--on-surface-variant` (slate)

---

## 5. Do / Don't

### Do
- Keep all surfaces in the `#0d1117 → #1e2a40` range
- Use `--font-mono` for display IDs, codes, step numbers
- Use muted status colors (emerald/rose/amber) — not saturated green/red
- Style scrollbars to match: `rgba(136,150,179,0.2)` thin track

### Don't
- No white (`#ffffff`) as a background anywhere
- No `#f7f8fc`, `#fafafa`, or any light surface tokens
- No saturated neon colors — keep everything slightly desaturated
- No 1px lines for section structure — only data table rows use separators
- No emoji as icons
