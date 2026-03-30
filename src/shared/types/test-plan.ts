export interface TestPlan {
  id: number
  name: string
  version: string
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

export interface CreateTestPlanDTO {
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
