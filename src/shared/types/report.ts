export type ReportFormat = 'pdf' | 'html'

export interface TestReport {
  id: number
  test_cycle_id: number
  generated_at: string
  format: ReportFormat
  file_path: string | null
}

export interface ReportData {
  cycle_name: string
  build_name: string
  plan_name: string
  plan_version: string
  total: number
  passed: number
  failed: number
  blocked: number
  unexecuted: number
  coverage_percent: number
  failed_cases: Array<{
    title: string
    category_name: string
    subcategory_name: string
    status: string
    bug_ref: string | null
  }>
}
