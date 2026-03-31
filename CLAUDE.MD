# 🚀 Expert-Level React & TS Standards (2026)

## 1. Core Architecture

- **Framework:** React 19+ / Next.js 15+ (App Router).
- **React Server Components (RSC):** Default to Server Components. Use `'use client'` only for leaf-node interactivity.
- **Data Fetching:** Prefer `async/await` in RSCs. Use the `use` hook for client-side promise unwrapping.
- **State Management:** Use **Zustand** for global state; **TanStack Query** for server state. Avoid `Context API` for high-frequency updates.

## 2. TypeScript Excellence

- **Strictness:** No `any`. Use `unknown` for unsafe boundaries.
- **Types vs Interfaces:** Use `interface` for public APIs/Props (extensibility); `type` for Unions, Intersections, and DTOs.
- **Discriminated Unions:** Mandatory for complex state (e.g., `{ status: 'loading' | 'success' | 'error' }`).
- **Utility Types:** Leverage `Pick`, `Omit`, and `ReturnType` to keep types DRY.

## 3. Component Patterns

- **Composition:** Prefer "Compound Components" (e.g., `Select` and `Select.Option`) over massive prop-drilled components.
- **Performance:** Use `React.memo` only after profiling. Avoid inline object creation in JSX props.
- **Logic:** Extract complex logic into **Custom Hooks**. Keep components under 100 lines.
- **Styling:** Tailwind CSS 4.0 only. No inline styles. Use `cva` (class-variance-authority) for complex variants.

## 4. Token & "Thinking" Optimization

- **Response Mode:** Act as a "Senior Architect." Be concise. No preambles or "Sure, I can help."
- **Thinking Limit:** For trivial UI tweaks, CSS fixes, or type corrections, **SKIP extended thinking**.
- **Context Hygiene:** Never re-read files unless explicitly tagged with `@`.
- **Refactoring:** Provide only the changed code blocks (diffs) rather than re-writing the entire file.

## 5. Implementation Rules

- Always use Arrow Functions for components.
- Use early returns to minimize nesting.
- Prioritize native browser APIs over heavy external libraries where possible.
- Include JSDoc only for complex logic; keep variable names self-documenting.
