import { registerProjectHandlers } from './project.handlers'
import { registerCategoryHandlers } from './category.handlers'
import { registerSubcategoryHandlers } from './subcategory.handlers'
import { registerTestCaseHandlers } from './test-case.handlers'
import { registerTestPlanHandlers } from './test-plan.handlers'
import { registerTestCycleHandlers } from './test-cycle.handlers'
import { registerAssignmentHandlers } from './assignment.handlers'
import { registerReportHandlers } from './report.handlers'
import { registerTestTypeHandlers } from './test-type.handlers'

export function registerAllHandlers(): void {
  registerProjectHandlers()
  registerCategoryHandlers()
  registerSubcategoryHandlers()
  registerTestCaseHandlers()
  registerTestPlanHandlers()
  registerTestCycleHandlers()
  registerAssignmentHandlers()
  registerReportHandlers()
  registerTestTypeHandlers()
}
