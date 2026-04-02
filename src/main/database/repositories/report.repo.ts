import type Database from 'better-sqlite3'
import type { TestReport, ReportData, MultiCycleReportData } from '@shared/types'

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

  getMultiCycleReportData(cycleIds: number[]): MultiCycleReportData {
    if (cycleIds.length === 0) throw new Error('No cycle IDs provided')

    // Get plan info from first cycle
    const planInfo = this.db.prepare(`
      SELECT tp.name as plan_name, tp.version as plan_version
      FROM test_cycle tc
      JOIN test_plan tp ON tc.test_plan_id = tp.id
      WHERE tc.id = ?
    `).get(cycleIds[0]) as { plan_name: string; plan_version: string }

    const placeholders = cycleIds.map(() => '?').join(',')

    // Get cycle names
    const cycleRows = this.db.prepare(
      `SELECT name, build_name FROM test_cycle WHERE id IN (${placeholders}) ORDER BY created_at`
    ).all(...cycleIds) as Array<{ name: string; build_name: string }>

    // Aggregate stats across all cycles
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = 'Fail' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'Unexecuted' THEN 1 ELSE 0 END) as unexecuted
      FROM test_case_assignment WHERE test_cycle_id IN (${placeholders})
    `).get(...cycleIds) as { total: number; passed: number; failed: number; blocked: number; unexecuted: number }

    const failedCases = this.db.prepare(`
      SELECT
        tc.title,
        cat.name as category_name,
        sub.name as subcategory_name,
        a.status,
        a.bug_ref,
        cy.name as cycle_name
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN subcategory sub ON tc.subcategory_id = sub.id
      JOIN category cat ON sub.category_id = cat.id
      JOIN test_cycle cy ON a.test_cycle_id = cy.id
      WHERE a.test_cycle_id IN (${placeholders}) AND a.status IN ('Fail', 'Blocked')
      ORDER BY cy.name, a.status, tc.title
    `).all(...cycleIds) as MultiCycleReportData['failed_cases']

    const executed = stats.total - stats.unexecuted
    const coveragePercent = stats.total > 0 ? Math.round((executed / stats.total) * 100) : 0

    return {
      ...planInfo,
      cycle_names: cycleRows.map(c => `${c.name} (${c.build_name})`),
      ...stats,
      coverage_percent: coveragePercent,
      failed_cases: failedCases
    }
  }
}
