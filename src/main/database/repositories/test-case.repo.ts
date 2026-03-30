import type Database from 'better-sqlite3'
import type { TestCase, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import { parseSteps, serializeSteps } from '@shared/utils/steps'

export class TestCaseRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: Record<string, unknown>): TestCase {
    return {
      ...row,
      steps: parseSteps(row.steps as string)
    } as unknown as TestCase
  }

  getByFolder(folderId: number): TestCase[] {
    const rows = this.db.prepare('SELECT * FROM test_case WHERE folder_id = ? ORDER BY title').all(folderId) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }

  getById(id: number): TestCase | undefined {
    const row = this.db.prepare('SELECT * FROM test_case WHERE id = ?').get(id) as Record<string, unknown> | undefined
    return row ? this.mapRow(row) : undefined
  }

  create(dto: CreateTestCaseDTO): TestCase {
    const result = this.db.prepare(
      'INSERT INTO test_case (title, description, steps, expected_result, folder_id) VALUES (?, ?, ?, ?, ?)'
    ).run(dto.title, dto.description, serializeSteps(dto.steps), dto.expected_result, dto.folder_id)

    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateTestCaseDTO): TestCase {
    const existing = this.getById(id)
    if (!existing) throw new Error('Test case not found')

    this.db.prepare(
      `UPDATE test_case SET
        title = ?,
        description = ?,
        steps = ?,
        expected_result = ?,
        folder_id = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.title ?? existing.title,
      dto.description ?? existing.description,
      dto.steps ? serializeSteps(dto.steps) : serializeSteps(existing.steps),
      dto.expected_result ?? existing.expected_result,
      dto.folder_id ?? existing.folder_id,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM test_case WHERE id = ?').run(id)
  }

  search(query: string): TestCase[] {
    const rows = this.db.prepare(
      `SELECT * FROM test_case WHERE title LIKE ? OR description LIKE ? ORDER BY title LIMIT 50`
    ).all(`%${query}%`, `%${query}%`) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }
}
