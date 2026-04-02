import type Database from 'better-sqlite3'
import type { TestPlan, CreateTestPlanDTO, UpdateTestPlanDTO } from '@shared/types'

export class TestPlanRepository {
  constructor(private db: Database.Database) {}

  private generateDisplayId(projectId: number): string {
    const row = this.db.prepare(`
      SELECT p.code, COUNT(tp.id) as count
      FROM project p
      LEFT JOIN test_plan tp ON tp.project_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(projectId) as { code: string; count: number } | undefined

    if (!row) return `PL${String(1).padStart(3, '0')}`
    return `${row.code}-PL${String(row.count + 1).padStart(3, '0')}`
  }

  getAll(): TestPlan[] {
    return this.db.prepare('SELECT * FROM test_plan ORDER BY start_date DESC').all() as TestPlan[]
  }

  getByProject(projectId: number): TestPlan[] {
    return this.db.prepare('SELECT * FROM test_plan WHERE project_id = ? ORDER BY start_date DESC').all(projectId) as TestPlan[]
  }

  getById(id: number): TestPlan | undefined {
    return this.db.prepare('SELECT * FROM test_plan WHERE id = ?').get(id) as TestPlan | undefined
  }

  create(dto: CreateTestPlanDTO): TestPlan {
    const displayId = this.generateDisplayId(dto.project_id)
    const result = this.db.prepare(
      'INSERT INTO test_plan (display_id, project_id, name, summary, version, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(displayId, dto.project_id, dto.name, dto.summary ?? '', dto.version, dto.start_date, dto.end_date)

    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateTestPlanDTO): TestPlan {
    const existing = this.getById(id)
    if (!existing) throw new Error('Test plan not found')

    this.db.prepare(
      `UPDATE test_plan SET
        name = ?,
        summary = ?,
        version = ?,
        start_date = ?,
        end_date = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.name ?? existing.name,
      dto.summary !== undefined ? dto.summary : existing.summary,
      dto.version ?? existing.version,
      dto.start_date ?? existing.start_date,
      dto.end_date ?? existing.end_date,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM test_plan WHERE id = ?').run(id)
  }
}
