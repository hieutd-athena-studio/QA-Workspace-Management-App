import type Database from 'better-sqlite3'
import type { TestReport, ReportData } from '@shared/types'

export class ReportRepository {
  constructor(private db: Database.Database) {}

  getByCycle(cycleId: number): TestReport[] {
    return this.db.prepare(
      'SELECT * FROM test_report WHERE test_cycle_id = ? ORDER BY generated_at DESC'
    ).all(cycleId) as TestReport[]
  }

  save(cycleId: number, format: 'pdf' | 'html', filePath: string): TestReport {
    const result = this.db.prepare(
      'INSERT INTO test_report (test_cycle_id, format, file_path) VALUES (?, ?, ?)'
    ).run(cycleId, format, filePath)

    return this.db.prepare('SELECT * FROM test_report WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as TestReport
  }

  getReportData(cycleId: number): ReportData {
    const info = this.db.prepare(`
      SELECT
        tc.name as cycle_name,
        tc.build_name,
        tp.name as plan_name,
        tp.version as plan_version
      FROM test_cycle tc
      JOIN test_plan tp ON tc.test_plan_id = tp.id
      WHERE tc.id = ?
    `).get(cycleId) as { cycle_name: string; build_name: string; plan_name: string; plan_version: string }

    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = 'Fail' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'Unexecuted' THEN 1 ELSE 0 END) as unexecuted
      FROM test_case_assignment WHERE test_cycle_id = ?
    `).get(cycleId) as { total: number; passed: number; failed: number; blocked: number; unexecuted: number }

    const failedCases = this.db.prepare(`
      SELECT
        tc.title,
        cat.name as category_name,
        sub.name as subcategory_name,
        a.status,
        a.bug_ref
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN subcategory sub ON tc.subcategory_id = sub.id
      JOIN category cat ON sub.category_id = cat.id
      WHERE a.test_cycle_id = ? AND a.status IN ('Fail', 'Blocked')
      ORDER BY a.status, tc.title
    `).all(cycleId) as ReportData['failed_cases']

    const executed = stats.total - stats.unexecuted
    const coveragePercent = stats.total > 0 ? Math.round((executed / stats.total) * 100) : 0

    return {
      ...info,
      ...stats,
      coverage_percent: coveragePercent,
      failed_cases: failedCases
    }
  }
}
