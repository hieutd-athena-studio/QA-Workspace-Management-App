# Design System Specification: The Precision Workspace

## 1. Overview & Creative North Star
**Creative North Star: The Orchestrated Workspace**
Modern QA management is an exercise in high-fidelity data processing. This design system moves beyond the "standard SaaS dashboard" to create a "Precision Workspace"—an environment that feels like a high-end editorial suite. We reject the clutter of traditional enterprise software in favor of intentional asymmetry, tonal depth, and a "breathing" layout.

The system is defined by **Functional Sophistication**. We achieve high information density not by crowding the screen, but by utilizing a rigorous typographic scale and "Invisible Containers." The goal is to make the user feel like an architect of quality, where the UI disappears to let the data lead.

---

## 2. Colors & Surface Architecture

### The Palette
We utilize a sophisticated Material-based tonal palette. While the primary action is a confident blue (`primary: #005ac2`), the workspace lives in the subtle shifts between Neutral Zinc and Slate tones.

*   **Primary (Action):** `#005ac2` | **On-Primary:** `#f7f7ff`
*   **Success:** `#006d4a` (Tertiary) | **Warning:** `#F59E0B` (Custom Accent)
*   **Critical:** `#9f403d` (Error) | **On-Error:** `#fff7f6`
*   **Surface Base:** `#faf8ff` (Surface)

### The "No-Line" Rule
To achieve a premium, editorial feel, **1px solid borders are prohibited for sectioning.** Do not draw a box around a sidebar or a header. Instead, define boundaries through background color shifts:
*   **Main Canvas:** `surface` (#faf8ff)
*   **Sidebar:** `surface-container-low` (#f2f3ff)
*   **Floating Utility Panels:** `surface-container-highest` (#d9e2ff)

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
1.  **Level 0 (Base):** `surface`
2.  **Level 1 (Sections):** `surface-container-low`
3.  **Level 2 (Cards/Interaction):** `surface-container-lowest` (Pure White) – This creates a "lifted" appearance against the greyish base without needing a shadow.

### The "Glass & Gradient" Rule
For high-priority CTAs and Hero states, use a subtle linear gradient from `primary` (#005ac2) to `primary_dim` (#004fab) at a 135-degree angle. For modals and floating tooltips, use **Glassmorphism**: `surface_container_low` at 80% opacity with a `20px` backdrop-blur.

---

## 3. Typography: The Editorial Engine
We use **Inter** for its mathematical precision and readability at small scales. The hierarchy is designed to guide the eye through complex QA reports.

*   **Display (Large Data Points):** `display-sm` (2.25rem) | Medium weight. Use for "Total Bugs" or "Pass Rate" hero numbers.
*   **Headline (Section Titles):** `headline-sm` (1.5rem) | Semi-bold. Used for major module headers.
*   **Title (Contextual Labels):** `title-sm` (1rem) | Medium weight. Used for card headers.
*   **Body (Primary Data):** `body-md` (0.875rem) | Regular. The workhorse for table data and descriptions.
*   **Label (Metadata):** `label-sm` (0.6875rem) | Bold/All-caps. Used for table headers and tiny status badges.

---

## 4. Elevation & Depth: Tonal Layering

### The Layering Principle
Forget shadows for structural containment. If a Test Suite card sits on the Dashboard, the Dashboard is `surface-container-low` and the Card is `surface-container-lowest`. This "Tonal Lift" is cleaner and faster for the eye to process.

### Ambient Shadows
Shadows are reserved only for "Floating" elements (Modals, Dropdowns).
*   **Style:** `0px 12px 32px rgba(17, 48, 105, 0.06)`. 
*   **Note:** We use a tinted shadow (using `on_surface` #113069) to ensure the shadow feels like an extension of the UI, not a dark smudge.

### The "Ghost Border" Fallback
If contrast is required for accessibility in data tables, use a **Ghost Border**: `outline-variant` (#98b1f2) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons & Chips
*   **Primary Button:** Gradient fill (Primary to Primary-Dim), 8px radius (`DEFAULT`), white text.
*   **Secondary Button:** Ghost style. No background, `outline` border at 20% opacity.
*   **Status Chips:** Use `tertiary_container` for Success and `error_container` for Critical. Text should always be the "On-Container" variant for maximum legibility.

### Data Tables (The Core)
*   **Header:** `label-md` in `on_surface_variant`. 
*   **Rows:** Minimum height of `3.5rem` (Spacing 16). 
*   **Separation:** No horizontal lines. Use a background shift to `surface_container_low` on `:hover`.
*   **Density:** Use `body-sm` for secondary data points within cells to maintain high density without visual noise.

### Input Fields
*   **Static State:** `surface_container_low` background, no border.
*   **Focus State:** 1px border using `primary` and a subtle 4px outer "glow" using `primary` at 10% opacity.
*   **Radius:** Always 8px (`DEFAULT`).

### Minimalist Cards
Cards must not have borders or heavy shadows. Use `spacing-5` (1.1rem) for internal padding. Content within cards should be separated by vertical whitespace (`spacing-4` or `spacing-6`), never by divider lines.

---

## 6. Do’s and Don’ts

### Do:
*   **Use Asymmetry:** In the top header, offset the search bar to the left and profile to the far right to create a sophisticated, non-template look.
*   **Embrace Whitespace:** If a section feels "tight," increase the spacing token by two levels (e.g., from `spacing-4` to `spacing-8`) rather than adding a border.
*   **Layer Surfaces:** Always place lighter surfaces on darker backgrounds to indicate "forward" movement in the Z-axis.

### Don’t:
*   **No Dividers:** Never use `<hr>` or solid 1px lines to separate list items. Use whitespace or subtle 5% opacity `outline-variant` shifts.
*   **No Pure Black:** Never use #000000. Use `inverse_surface` (#060e20) for the deepest neutrals.
*   **No Default Radii:** Avoid mixing border-radii. Stick to `DEFAULT` (8px) for components and `lg` (16px) for large containers.