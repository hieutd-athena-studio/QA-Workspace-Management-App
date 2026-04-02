# QA Workspace Management App

A desktop application for managing QA test cases, test plans, test cycles, and execution reports. Built with Electron + React, storing all data locally via SQLite.

---

## Features

- **Test Library** — Organize test cases in a 2-level category/subcategory hierarchy. Create, edit, delete, and search test cases with steps and expected results. Import and export via CSV.
- **Test Plans** — Group test cycles under versioned plans with an optional summary describing tested features.
- **Test Cycles** — Assign test cases to a cycle (e.g., a specific build), execute them one by one, and record Pass / Fail / Blocked results with optional bug references.
- **Execution Mode** — Keyboard-driven pass/fail flow with step-by-step guidance. Navigate cases with arrow keys.
- **Reports** — View pass/fail/blocked/pending stats for a single cycle or aggregate across all cycles in a plan. Export as PDF or HTML.
- **CSV Import/Export** — Bulk import test cases from CSV with auto-creation of categories/subcategories. Export the full library to CSV.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | Electron |
| Frontend | React 18 + TypeScript |
| Database | better-sqlite3 (SQLite) |
| IPC bridge | Electron contextBridge (preload) |
| Build tool | electron-vite + Vite |
| Styling | Plain CSS (no Tailwind, no CSS-in-JS) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server (hot reload on all changes)
npm run dev
```

### Other Commands

```bash
npm run build      # Build for distribution
npm run preview    # Preview the built app locally
npm run start      # Alias for preview
```

---

## Project Structure

```
src/
├── main/           # Electron main process — database, IPC handlers
│   ├── database/   # better-sqlite3 connection, migrations, repositories
│   ├── ipc/        # IPC handler files (one per domain)
│   └── services/   # Business logic (report generation)
├── renderer/       # React frontend
│   ├── pages/      # One page component per route
│   ├── components/ # Shared and domain-specific components
│   ├── contexts/   # React contexts (project, notifications, invalidation)
│   ├── hooks/      # Custom hooks (useApi)
│   └── assets/     # Global CSS design tokens and utilities
├── preload/        # contextBridge — defines window.api for the renderer
└── shared/         # Types and IPC channel constants shared across processes
```

See [CLAUDE.md](./CLAUDE.md) for the full annotated directory tree and architecture details.

---

## Database

All data is stored in a local SQLite database managed by [better-sqlite3](https://github.com/WiseLibs/better-sqlite3). The schema is versioned through migration files in `src/main/database/migrations/`.

| Migration | Description |
|---|---|
| `001-initial-schema.ts` | Core tables: test cases, plans, cycles, assignments |
| `002-add-projects.ts` | Multi-project support |
| `003-add-test-case-version.ts` | Version tracking for test cases |
| `004-restructure-categories.ts` | Replaced recursive folder tree with 2-level category/subcategory |
| `005-add-plan-summary.ts` | Optional summary field on test plans |

---

## CSV Import Format

To bulk-import test cases, prepare a CSV file with the following columns (first row must be the header):

```
Category,Sub-category,Title,Description,Steps,Expected Result
```

| Column | Required | Description |
|---|---|---|
| Category | Yes | Main category name. Created automatically if it doesn't exist. |
| Sub-category | Yes | Subcategory name within the category. Created automatically if it doesn't exist. |
| Title | Yes | Short name for the test case. |
| Description | No | Detailed description of what the test covers. |
| Steps | No | Numbered steps separated by newlines or semicolons. |
| Expected Result | No | The expected outcome when the test passes. |

**Notes:**
- Fields containing commas or newlines must be wrapped in double quotes.
- To include a literal double quote inside a field, escape it as `""`.
- Existing categories/subcategories are reused by name match — no duplicates created.

**Example:**

```csv
Category,Sub-category,Title,Description,Steps,Expected Result
Authentication,Login,Valid credentials login,Verify login with correct credentials,"1. Navigate to login page
2. Enter valid username
3. Enter valid password
4. Click Login",User is redirected to dashboard
Authentication,Login,Invalid password,Verify error shown for wrong password,"1. Enter valid username
2. Enter wrong password
3. Click Login",Error message is displayed
```

---

## Architecture Notes

- **No direct IPC in components** — all `window.api` calls go through custom hooks or handlers in pages.
- **Type safety** — shared types in `src/shared/types/` are the single source of truth for both main and renderer processes.
- **Invalidation pattern** — after any mutation, call `invalidate('domain')` to trigger a data refetch in all subscribed hooks.
- **Two-level hierarchy** — categories contain subcategories; test cases belong to subcategories only. Categories cannot hold test cases directly.

---

## Contributing

Follow the conventions in [CLAUDE.md](./CLAUDE.md):

- No `any` types in TypeScript
- One CSS file per component (no inline styles)
- Arrow function components only
- Atomic commits with descriptive messages
