export type ExecutionStatus = 'Pass' | 'Fail' | 'Blocked' | 'Unexecuted'

export interface TestCaseAssignment {
  id: number
  test_cycle_id: number
  test_case_id: number
  status: ExecutionStatus
  bug_ref: string | null
  executed_at: string | null
  created_at: string
  updated_at: string
  // Joined fields from test_case
  test_case_title?: string
  test_case_description?: string
  test_case_steps?: string
  test_case_expected_result?: string
  // Joined fields from subcategory + category
  category_name?: string
  subcategory_name?: string
}

export interface UpdateAssignmentStatusDTO {
  status: ExecutionStatus
  bug_ref?: string | null
}
