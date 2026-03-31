import { registerProjectHandlers } from './project.handlers'
import { registerFolderHandlers } from './folder.handlers'
import { registerTestCaseHandlers } from './test-case.handlers'
import { registerTestPlanHandlers } from './test-plan.handlers'
import { registerTestCycleHandlers } from './test-cycle.handlers'
import { registerAssignmentHandlers } from './assignment.handlers'
import { registerReportHandlers } from './report.handlers'

export function registerAllHandlers(): void {
  registerProjectHandlers()
  registerFolderHandlers()
  registerTestCaseHandlers()
  registerTestPlanHandlers()
  registerTestCycleHandlers()
  registerAssignmentHandlers()
  registerReportHandlers()
}
