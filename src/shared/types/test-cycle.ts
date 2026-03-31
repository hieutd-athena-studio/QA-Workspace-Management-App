export interface TestCycle {
  id: number
  display_id: string
  name: string
  build_name: string
  test_plan_id: number
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface CreateTestCycleDTO {
  name: string
  build_name: string
  test_plan_id: number
  start_date?: string | null
  end_date?: string | null
}

export interface UpdateTestCycleDTO {
  name?: string
  build_name?: string
  start_date?: string | null
  end_date?: string | null
}
