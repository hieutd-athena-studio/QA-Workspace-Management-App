import type Database from 'better-sqlite3'
import type { TestPlan, CreateTestPlanDTO, UpdateTestPlanDTO } from '@shared/types'

export class TestPlanRepository {
  constructor(private db: Database.Database) {}

  getAll(): TestPlan[] {
    return this.db.prepare('SELECT * FROM test_plan ORDER BY start_date DESC').all() as TestPlan[]
  }

  getById(id: number): TestPlan | undefined {
    return this.db.prepare('SELECT * FROM test_plan WHERE id = ?').get(id) as TestPlan | undefined
  }

  create(dto: CreateTestPlanDTO): TestPlan {
    const result = this.db.prepare(
      'INSERT INTO test_plan (name, version, start_date, end_date) VALUES (?, ?, ?, ?)'
    ).run(dto.name, dto.version, dto.start_date, dto.end_date)

    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateTestPlanDTO): TestPlan {
    const existing = this.getById(id)
    if (!existing) throw new Error('Test plan not found')

    this.db.prepare(
      `UPDATE test_plan SET
        name = ?,
        version = ?,
        start_date = ?,
        end_date = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.name ?? existing.name,
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
