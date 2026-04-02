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

  private generateDisplayId(subcategoryId: number): string {
    const row = this.db.prepare(`
      SELECT p.code, COUNT(tc.id) as count
      FROM project p
      JOIN category cat ON cat.project_id = p.id
      JOIN subcategory sub ON sub.category_id = cat.id
      LEFT JOIN test_case tc ON tc.subcategory_id IN (
        SELECT sub2.id FROM subcategory sub2
        JOIN category cat2 ON sub2.category_id = cat2.id
        WHERE cat2.project_id = p.id
      )
      WHERE sub.id = ?
      GROUP BY p.id
    `).get(subcategoryId) as { code: string; count: number } | undefined

    if (!row) throw new Error(`Subcategory ${subcategoryId} not found or has no project link`)
    return `${row.code}-TC${String(row.count + 1).padStart(3, '0')}`
  }

  getBySubcategory(subcategoryId: number): TestCase[] {
    const rows = this.db.prepare(
      'SELECT * FROM test_case WHERE subcategory_id = ? ORDER BY title'
    ).all(subcategoryId) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }

  getById(id: number): TestCase | undefined {
    const row = this.db.prepare(
      'SELECT * FROM test_case WHERE id = ?'
    ).get(id) as Record<string, unknown> | undefined
    return row ? this.mapRow(row) : undefined
  }

  create(dto: CreateTestCaseDTO): TestCase {
    const displayId = this.generateDisplayId(dto.subcategory_id)
    const result = this.db.prepare(
      'INSERT INTO test_case (display_id, title, description, steps, expected_result, version, subcategory_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(displayId, dto.title, dto.description, serializeSteps(dto.steps), dto.expected_result, dto.version, dto.subcategory_id)
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
        version = ?,
        subcategory_id = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.title ?? existing.title,
      dto.description ?? existing.description,
      dto.steps ? serializeSteps(dto.steps) : serializeSteps(existing.steps),
      dto.expected_result ?? existing.expected_result,
      dto.version ?? existing.version,
      dto.subcategory_id ?? existing.subcategory_id,
      id
    )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM test_case WHERE id = ?').run(id)
  }

  getByProject(projectId: number): TestCase[] {
    const rows = this.db.prepare(
      `SELECT tc.* FROM test_case tc
       JOIN subcategory sub ON tc.subcategory_id = sub.id
       WHERE sub.project_id = ?
       ORDER BY tc.title`
    ).all(projectId) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }

  getByProjectWithHierarchy(projectId: number): Array<TestCase & { category_name: string; subcategory_name: string }> {
    const rows = this.db.prepare(
      `SELECT tc.*, cat.name as category_name, sub.name as subcategory_name
       FROM test_case tc
       JOIN subcategory sub ON tc.subcategory_id = sub.id
       JOIN category cat ON sub.category_id = cat.id
       WHERE sub.project_id = ?
       ORDER BY cat.name, sub.name, tc.title`
    ).all(projectId) as Record<string, unknown>[]
    return rows.map(r => ({
      ...this.mapRow(r),
      category_name: r.category_name as string,
      subcategory_name: r.subcategory_name as string
    }))
  }

  search(query: string, projectId?: number): TestCase[] {
    if (projectId !== undefined) {
      const rows = this.db.prepare(
        `SELECT tc.* FROM test_case tc
         JOIN subcategory sub ON tc.subcategory_id = sub.id
         WHERE sub.project_id = ? AND (tc.title LIKE ? OR tc.description LIKE ?)
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
