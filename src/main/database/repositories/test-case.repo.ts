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

  private generateDisplayId(folderId: number): string {
    const row = this.db.prepare(`
      SELECT p.code, COUNT(tc.id) as count
      FROM project p
      JOIN folder f ON f.project_id = p.id
      LEFT JOIN test_case tc ON tc.folder_id IN (
        SELECT id FROM folder WHERE project_id = p.id
      )
      WHERE f.id = ?
      GROUP BY p.id
    `).get(folderId) as { code: string; count: number } | undefined

    if (!row) return `TC${String(1).padStart(3, '0')}`
    return `${row.code}-TC${String(row.count + 1).padStart(3, '0')}`
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
    const displayId = this.generateDisplayId(dto.folder_id)
    const result = this.db.prepare(
      'INSERT INTO test_case (display_id, title, description, steps, expected_result, folder_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(displayId, dto.title, dto.description, serializeSteps(dto.steps), dto.expected_result, dto.folder_id)

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

  search(query: string, projectId?: number): TestCase[] {
    if (projectId !== undefined) {
      const rows = this.db.prepare(
        `SELECT tc.* FROM test_case tc
         JOIN folder f ON tc.folder_id = f.id
         WHERE f.project_id = ? AND (tc.title LIKE ? OR tc.description LIKE ?)
         ORDER BY tc.title LIMIT 50`
      ).all(projectId, `%${query}%`, `%${query}%`) as Record<string, unknown>[]
      return rows.map(r => this.mapRow(r))
    }
    const rows = this.db.prepare(
      `SELECT * FROM test_case WHERE title LIKE ? OR description LIKE ? ORDER BY title LIMIT 50`
    ).all(`%${query}%`, `%${query}%`) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }
}
