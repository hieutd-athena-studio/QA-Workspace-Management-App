# QA Workspace Management Desktop Application

Build a **desktop QA Workspace Management application** using Electron, React, TypeScript, and local SQLite. This application supports the full QA lifecycle: authoring test cases, organizing them into test plans/cycles, executing tests against builds, and generating exportable reports. The app will be a single-user, local-first internal tool with no backend server.

## User Review Required

> [!IMPORTANT]
> Please review the chosen technology stack, especially the database and styling/Gantt components, to ensure they match your expectations before we proceed to execution.
- **Database:** `better-sqlite3` is extremely performant for Electron main processes.
- **State/IPC:** Frontend will communicate with the local db via IPC bridges (contextBridge).
- **Gantt Chart:** I suggest using `@dhtmlx/trial-react-gantt` or `frappe-gantt` depending on sizing constraints. 
- **Styling:** As per modern aesthetics guidelines, I will use pure CSS or a modern approach like Tailwind (if preferred, please confirm) with a dark mode or sleek glassmorphism design.
- **Exporting:** Electron's native `webContents.printToPDF()` is generally the cleanest and most robust way to export HTML layouts to PDF.

## Project Structure & Architecture

We will organize the application into distinct processes following Electron best practices: the **Main Process** (Node/SQLite) and the **Renderer Process** (React UI).

```
QA-Workspace-Management-App/
├── package.json
├── tsconfig.json
├── forge.config.ts              # Native packing configuration
├── electron/                    # [MAIN PROCESS] 
│   ├── main.ts                  # App lifecycle & entry point
│   ├── preload.ts               # IPC contextBridge configuration
│   ├── ipc/                     # Handlers for IPC events from frontend
│   │   ├── databaseHandlers.ts  # Route requests to SQLite
│   │   └── systemHandlers.ts    # PDF export, dialog handlers
│   └── database/
│       ├── connection.ts        # better-sqlite3 init
│       ├── schema.ts            # Tables for Folders, TestCases, Plans
│       └── queries/             # CRUD operations for entities
└── src/                         # [RENDERER PROCESS] (React)
    ├── index.css                # Global styles / design system
    ├── main.tsx                 # React DOM mount
    ├── App.tsx                  # Root layout structure
    ├── ipc.d.ts                 # Types for window.electron IPC bridge
    ├── assets/                  # Icons, fonts, images
    ├── components/              # Shared UI (Buttons, Modals, Cards)
    ├── styles/                  # CSS modules or stylized configurations
    ├── types/                   # Shared TypeScript models (TestPlan, Folder, etc)
    └── features/                # Domain-specific modules
        ├── test-authoring/      # Folder tree view, TestCase editor
        ├── test-plans/          # Plan creation, Gantt chart timeline
        ├── test-execution/      # Test Cycle run UI, Pass/Fail forms
        └── reporting/           # Report generation and export preview
```

## Implementation Phases (Task Planning)

### Phase 1: Foundation & Scaffolding
- Initialize Electron + Vite + React + TypeScript boilerplate.
- Setup `better-sqlite3` in the main process and create integer/local database schemas.
- Set up IPC bridging so the React frontend can securely execute queries.
- Build the foundational Design System (premium UI with global css, layout shell, sidebar).

### Phase 2: Category & Test Case Authoring
- Create SQLite queries for generating arbitrary-depth tree structures for Folders.
- Build the `TestCase` CRUD views.
- Assemble the UI (Resizable Sidebar for folders, main pane for Test Case details).

### Phase 3: Planning & Gantt Integration
- Build CRUD for `TestPlan` and `TestCycle` (Cycles belong to Plans).
- Implement a read-only Gantt Chart component visualizing Plans as parent bars and related cycles as sub-bars spread across a timeline.

### Phase 4: Execution & Test Runs
- Develop the test execution UI allowing users to mark tests as: `Pass`, `Fail`, or `Blocked`.
- Support attaching `bug_ref` directly to test execution rows.

### Phase 5: Reporting & Export
- Build aggregate queries to calculate coverage, metrics, and failure counts.
- Build a beautiful Document Layout view.
- Wire up Electron's `printToPDF()` to allow to save the summary to disk natively.

## Open Questions

> [!WARNING]
> I need a few clarifications to dial in the setup perfectly.

1. **Styling Approach:** Do you prefer Vanilla CSS, Tailwind CSS, or a Component library? (Note: standard rules push for Vanilla CSS, but I want to ensure you don't have a strong preference).
2. **Build Tooling:** Shall I initialize the project using `electron-vite` (a very popular abstraction that sets up Electron, Vite, React, and TS beautifully)?
3. **Gantt Chart Details:** The chart is read-only. Are there specific time scales required? (Days/Weeks/Months)

## Verification Plan

### Automated Tests
- Validate DB schema integrity and foreign keys directly via SQLite.

### Manual Verification
- Open the Electron app and attempt to create a nested folder structure and assign test cases.
- Create a test plan, assign cycles, and run them.
- Ensure state persists across full application restarts.
- Generate a PDF report and verify the layout formatting and accuracy of numbers.
