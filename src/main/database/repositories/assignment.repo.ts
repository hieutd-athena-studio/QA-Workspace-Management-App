import type Database from 'better-sqlite3'
import type { TestCaseAssignment, UpdateAssignmentStatusDTO } from '@shared/types'

export class AssignmentRepository {
  constructor(private db: Database.Database) {}

  getByCycle(cycleId: number): TestCaseAssignment[] {
    return this.db.prepare(`
      SELECT a.*,
        tc.title as test_case_title,
        tc.description as test_case_description,
        tc.steps as test_case_steps,
        tc.expected_result as test_case_expected_result,
        f.path as folder_path
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN folder f ON tc.folder_id = f.id
      ORDER BY f.path, tc.title
    `).all() as TestCaseAssignment[]
  }

  getByCycleFiltered(cycleId: number): TestCaseAssignment[] {
    return this.db.prepare(`
      SELECT a.*,
        tc.title as test_case_title,
        tc.description as test_case_description,
        tc.steps as test_case_steps,
        tc.expected_result as test_case_expected_result,
        f.path as folder_path
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN folder f ON tc.folder_id = f.id
      WHERE a.test_cycle_id = ?
      ORDER BY f.path, tc.title
    `).all(cycleId) as TestCaseAssignment[]
  }

  assign(cycleId: number, testCaseIds: number[]): void {
    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO test_case_assignment (test_cycle_id, test_case_id) VALUES (?, ?)'
    )

    const assignAll = this.db.transaction(() => {
      for (const tcId of testCaseIds) {
        insert.run(cycleId, tcId)
      }
    })

    assignAll()
  }

  unassign(assignmentId: number): void {
    this.db.prepare('DELETE FROM test_case_assignment WHERE id = ?').run(assignmentId)
  }

  updateStatus(id: number, dto: UpdateAssignmentStatusDTO): TestCaseAssignment {
    const executedAt = dto.status !== 'Unexecuted' ? new Date().toISOString() : null

    this.db.prepare(
      `UPDATE test_case_assignment SET
        status = ?,
        bug_ref = ?,
        executed_at = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(dto.status, dto.bug_ref ?? null, executedAt, id)

    return this.db.prepare(`
      SELECT a.*,
        tc.title as test_case_title,
        tc.description as test_case_description,
        tc.steps as test_case_steps,
        tc.expected_result as test_case_expected_result,
        f.path as folder_path
      FROM test_case_assignment a
      JOIN test_case tc ON a.test_case_id = tc.id
      JOIN folder f ON tc.folder_id = f.id
      WHERE a.id = ?
    `).get(id) as TestCaseAssignment
  }

  getStatsByCycle(cycleId: number): { total: number; passed: number; failed: number; blocked: number; unexecuted: number } {
    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Pass' THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN status = 'Fail' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'Unexecuted' THEN 1 ELSE 0 END) as unexecuted
      FROM test_case_assignment
      WHERE test_cycle_id = ?
    `).get(cycleId) as { total: number; passed: number; failed: number; blocked: number; unexecuted: number }

    return row
  }
}
