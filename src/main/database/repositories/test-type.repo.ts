import type Database from 'better-sqlite3'
import type { TestType, CreateTestTypeDTO, UpdateTestTypeDTO } from '@shared/types'

export class TestTypeRepository {
  constructor(private db: Database.Database) {}

  private mapRow(row: Record<string, unknown>): TestType {
    return row as unknown as TestType
  }

  getByProject(projectId: number): TestType[] {
    const rows = this.db.prepare(`
      SELECT tt.*, COUNT(ttc.test_case_id) as test_case_count
      FROM test_type tt
      LEFT JOIN test_type_case ttc ON ttc.test_type_id = tt.id
      WHERE tt.project_id = ?
      GROUP BY tt.id
      ORDER BY tt.name ASC
    `).all(projectId) as Record<string, unknown>[]
    return rows.map(r => this.mapRow(r))
  }

  getById(id: number): TestType | undefined {
    const row = this.db.prepare(`
      SELECT tt.*, COUNT(ttc.test_case_id) as test_case_count
      FROM test_type tt
      LEFT JOIN test_type_case ttc ON ttc.test_type_id = tt.id
      WHERE tt.id = ?
      GROUP BY tt.id
    `).get(id) as Record<string, unknown> | undefined
    return row ? this.mapRow(row) : undefined
  }

  create(dto: CreateTestTypeDTO): TestType {
    const result = this.db.prepare(
      'INSERT INTO test_type (name, project_id) VALUES (?, ?)'
    ).run(dto.name, dto.project_id)
    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateTestTypeDTO): TestType {
    const existing = this.getById(id)
    if (!existing) throw new Error(`Test type ${id} not found`)
    this.db.prepare('UPDATE test_type SET name = ? WHERE id = ?').run(dto.name, id)
    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM test_type WHERE id = ?').run(id)
  }

  addTestCase(testTypeId: number, testCaseId: number): void {
    this.db.prepare(
      'INSERT OR IGNORE INTO test_type_case (test_type_id, test_case_id) VALUES (?, ?)'
    ).run(testTypeId, testCaseId)
  }

  removeTestCase(testTypeId: number, testCaseId: number): void {
    this.db.prepare(
      'DELETE FROM test_type_case WHERE test_type_id = ? AND test_case_id = ?'
    ).run(testTypeId, testCaseId)
  }

  getTestCaseIds(testTypeId: number): number[] {
    const rows = this.db.prepare(
      'SELECT test_case_id FROM test_type_case WHERE test_type_id = ?'
    ).all(testTypeId) as Array<{ test_case_id: number }>
    return rows.map(r => r.test_case_id)
  }
}
