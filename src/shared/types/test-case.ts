export interface TestStep {
  step: number
  action: string
  expected: string
}

export interface TestCase {
  id: number
  display_id: string
  title: string
  description: string
  steps: TestStep[]
  expected_result: string
  folder_id: number
  created_at: string
  updated_at: string
}

export interface CreateTestCaseDTO {
  title: string
  description: string
  steps: TestStep[]
  expected_result: string
  folder_id: number
}

export interface UpdateTestCaseDTO {
  title?: string
  description?: string
  steps?: TestStep[]
  expected_result?: string
  folder_id?: number
}
