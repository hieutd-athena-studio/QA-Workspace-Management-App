# Deep Interview Spec: QA Workspace Management

## Metadata
- Interview ID: qa-workspace-001
- Rounds: 9
- Final Ambiguity Score: 17%
- Type: greenfield
- Generated: 2026-03-30
- Threshold: 20%
- Status: PASSED

## Clarity Breakdown
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Goal Clarity | 0.88 | 0.40 | 0.352 |
| Constraint Clarity | 0.80 | 0.30 | 0.240 |
| Success Criteria | 0.80 | 0.30 | 0.240 |
| **Total Clarity** | | | **0.832** |
| **Ambiguity** | | | **17%** |

## Goal
Build a **desktop QA Workspace Management application** (Electron + React + TypeScript + local SQLite) that supports the full QA lifecycle: authoring test cases → organizing into test plans/cycles → executing tests against builds → generating exportable reports.

## Constraints
- **Platform**: Desktop application (Electron + React + TypeScript)
- **Data storage**: Local SQLite database per user — no server, no network, no authentication
- **Tenancy**: Single-user, single-team internal tool — no multi-tenancy
- **Test execution record**: Pass / Fail / Blocked status + bug/defect reference (tracker ID) per test case result
- **Category system**: Folders with arbitrary depth (tree structure) for organizing test cases
- **Gantt chart**: Read-only timeline showing test plans as parent bars with test cycles as nested sub-bars
- **Reports**: Exportable documents (PDF and/or HTML) with pass/fail summary, defect reference list, and coverage

## Non-Goals
- Multi-tenant or cloud-hosted SaaS
- Backend API or remote database
- User authentication / access control
- Real-time collaboration between QA team members
- Native mobile or web browser app
- Drag-to-resize Gantt chart interaction
- Notes/comments or screenshot attachments on test results
- Integration with CI/CD pipelines (builds entered manually)

## Acceptance Criteria
- [ ] QA can create a folder tree of arbitrary depth and create/edit/delete test cases within folders
- [ ] QA can create a Test Plan with a name, version, start date, and end date
- [ ] QA can add multiple Test Cycles to a Test Plan, each representing a build (e.g., "Build 1.0.1", "Build 1.0.2")
- [ ] QA can assign test cases to a Test Cycle (selecting from the folder library)
- [ ] QA can execute a Test Cycle: open each test case and mark it Pass / Fail / Blocked, and optionally attach a bug reference ID
- [ ] Gantt chart view shows all Test Plans on a timeline; each plan expands to show its Test Cycles as nested sub-bars within the plan's date range
- [ ] QA can generate an exportable report (PDF/HTML) for a completed Test Cycle showing: pass/fail/blocked counts, list of failed/blocked test cases with their bug references, and test coverage percentage
- [ ] All data persists in a local SQLite database on the user's machine across app restarts
- [ ] App launches as a native Electron desktop window on macOS/Windows

## Assumptions Exposed & Resolved
| Assumption | Challenge | Resolution |
|------------|-----------|------------|
| "Manage" could mean different things | Asked what QA does first | All three phases equally: authoring, planning, executing |
| Reports might not be the primary value | Contrarian: dashboard vs report | Formal exportable report confirmed |
| Team collaboration assumed | Asked about data storage model | No collaboration needed — local SQLite per user |
| Categories could be flat or hierarchical | Simplifier: what's minimum viable | Folders with arbitrary depth (file-system style) |
| Gantt chart scope unknown | Asked what it shows and does | Read-only: test plans + nested cycles, no drag interaction |
| Test execution data scope unclear | Simplifier mode | Pass/Fail/Blocked + bug ref only; no notes/attachments |

## Technical Context
- **Frontend framework**: React with TypeScript inside Electron renderer process
- **Desktop shell**: Electron (Chromium-based, cross-platform macOS + Windows)
- **Local database**: SQLite via `better-sqlite3` or `electron-better-sqlite3`
- **Gantt library**: A React-based Gantt chart component (e.g., `frappe-gantt`, `@dhtmlx/trial-react-gantt`, or custom with `d3`)
- **PDF export**: `jsPDF` + `html2canvas`, or Electron's native `printToPDF()` via BrowserWindow
- **Build tool**: Electron Forge or `electron-builder` for packaging

## Ontology (Key Entities)

| Entity | Type | Fields | Relationships |
|--------|------|--------|---------------|
| TestCase | core domain | id, title, description, steps, expected_result, folder_id | belongs to Folder; assigned to many TestCycles |
| Folder | core domain | id, name, parent_folder_id, path | has many Folders (self-referential); has many TestCases |
| TestPlan | core domain | id, name, version, start_date, end_date | has many TestCycles |
| TestCycle | core domain | id, name, build_name, test_plan_id | belongs to TestPlan; has many TestCaseAssignments |
| TestCaseAssignment | supporting | id, test_cycle_id, test_case_id, status, bug_ref | belongs to TestCycle and TestCase |
| TestResult | supporting | status (Pass/Fail/Blocked), bug_ref | embedded in TestCaseAssignment |
| TestReport | supporting | id, test_cycle_id, generated_at, format | belongs to TestCycle; contains aggregated results |
| QAUser | external system | local user (no auth) | implicit owner of all data |

## Ontology Convergence
| Round | Entity Count | New | Changed | Stable | Stability Ratio |
|-------|-------------|-----|---------|--------|----------------|
| 1 | 5 | 5 | - | - | N/A |
| 2 | 5 | 0 | 0 | 5 | 100% |
| 3 | 6 | 1 (Build) | 0 | 5 | 83% |
| 4 | 7 | 1 (Category→Folder) | 0 | 6 | 86% |
| 5–9 | 8 | 1 (TestResult) | 0 | 7 | 88%→100% |

Ontology fully converged by Round 7. The `Category` entity was renamed to `Folder` in Round 9 when the folder-tree model was confirmed — this is a rename (changed), not a removal.

## Interview Transcript
<details>
<summary>Full Q&A (9 rounds)</summary>

### Round 1
**Q:** When a QA opens this app to start working, what is the FIRST thing they do?
**A:** All three equally (authoring → planning → executing → reporting)
**Ambiguity:** 72% (Goal: 0.55, Constraints: 0.10, Criteria: 0.10)

### Round 2
**Q:** Is this for a single team/company (internal tool) or multi-tenant SaaS?
**A:** Single team / internal tool
**Ambiguity:** 66% (Goal: 0.55, Constraints: 0.30, Criteria: 0.10)

### Round 3
**Q:** What is the platform for this tool?
**A:** Desktop app
**Ambiguity:** 59% (Goal: 0.55, Constraints: 0.45, Criteria: 0.20)

### Round 4
**Q:** [Contrarian] What would a QA Lead actually look at first — formal report or live dashboard?
**A:** Formal report (exportable)
**Ambiguity:** 50% (Goal: 0.60, Constraints: 0.45, Criteria: 0.40)

### Round 5
**Q:** Where is the data stored for team collaboration?
**A:** Local SQLite per user
**Ambiguity:** 41% (Goal: 0.65, Constraints: 0.65, Criteria: 0.45)

### Round 6
**Q:** [Simplifier] What's the minimum a QA records per test case during a run?
**A:** Pass/Fail/Blocked status + Bug/defect reference
**Ambiguity:** 33% (Goal: 0.75, Constraints: 0.65, Criteria: 0.60)

### Round 7
**Q:** What tech stack for the desktop app?
**A:** Electron + React + TypeScript
**Ambiguity:** 28% (Goal: 0.75, Constraints: 0.80, Criteria: 0.60)

### Round 8
**Q:** What does the Gantt chart show and do?
**A:** Test plans as parent bars + test cycles as nested sub-bars (read-only)
**Ambiguity:** 22% (Goal: 0.82, Constraints: 0.80, Criteria: 0.72)

### Round 9
**Q:** How are test cases grouped into categories?
**A:** Folders with arbitrary depth (file-system style)
**Ambiguity:** 17% (Goal: 0.88, Constraints: 0.80, Criteria: 0.80)

</details>
