export interface TestType {
  id: number
  name: string
  project_id: number
  created_at: string
  test_case_count: number
}

export interface CreateTestTypeDTO {
  name: string
  project_id: number
}

export interface UpdateTestTypeDTO {
  name: string
}
