export interface TestPlan {
  id: number
  display_id: string
  project_id: number
  name: string
  version: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface CreateTestPlanDTO {
  project_id: number
  name: string
  version: string
  start_date: string
  end_date: string
}

export interface UpdateTestPlanDTO {
  name?: string
  version?: string
  start_date?: string
  end_date?: string
}
