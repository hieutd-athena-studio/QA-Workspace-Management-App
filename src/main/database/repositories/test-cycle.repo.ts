import type Database from 'better-sqlite3'
import type { TestCycle, CreateTestCycleDTO, UpdateTestCycleDTO } from '@shared/types'

export class TestCycleRepository {
  constructor(private db: Database.Database) {}

  getByPlan(planId: number): TestCycle[] {
    return this.db.prepare(
      'SELECT * FROM test_cycle WHERE test_plan_id = ? ORDER BY created_at'
    ).all(planId) as TestCycle[]
  }

  getById(id: number): TestCycle | undefined {
    return this.db.prepare('SELECT * FROM test_cycle WHERE id = ?').get(id) as TestCycle | undefined
  }

  create(dto: CreateTestCycleDTO): TestCycle {
    const result = this.db.prepare(
      'INSERT INTO test_cycle (name, build_name, test_plan_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)'
    ).run(dto.name, dto.build_name, dto.test_plan_id, dto.start_date ?? null, dto.end_date ?? null)

    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateTestCycleDTO): TestCycle {
    const existing = this.getById(id)
    if (!existing) throw new Error('Test cycle not found')

    this.db.prepare(
      `UPDATE test_cycle SET
        name = ?,
        build_name = ?,
        start_date = ?,
        end_date = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.name ?? existing.name,
      dto.build_name ?? existing.build_name,
      dto.start_date !== undefined ? dto.start_date : existing.start_date,
      dto.end_date !== undefined ? dto.end_date : existing.end_date,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM test_cycle WHERE id = ?').run(id)
  }

  /** For Gantt: get cycles with COALESCE to parent plan dates */
  getByPlanWithDates(planId: number): (TestCycle & { effective_start: string; effective_end: string })[] {
    return this.db.prepare(`
      SELECT tc.*,
        COALESCE(tc.start_date, tp.start_date) as effective_start,
        COALESCE(tc.end_date, tp.end_date) as effective_end
      FROM test_cycle tc
      JOIN test_plan tp ON tc.test_plan_id = tp.id
      WHERE tc.test_plan_id = ?
      ORDER BY tc.created_at
    `).all(planId) as (TestCycle & { effective_start: string; effective_end: string })[]
  }
}
