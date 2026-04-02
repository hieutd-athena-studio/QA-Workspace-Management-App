import type Database from 'better-sqlite3'
import type { Category, CreateCategoryDTO } from '@shared/types'

export class CategoryRepository {
  constructor(private db: Database.Database) {}

  getByProject(projectId: number): Category[] {
    return this.db.prepare(
      'SELECT * FROM category WHERE project_id = ? ORDER BY name'
    ).all(projectId) as Category[]
  }

  getById(id: number): Category | undefined {
    return this.db.prepare(
      'SELECT * FROM category WHERE id = ?'
    ).get(id) as Category | undefined
  }

  create(dto: CreateCategoryDTO): Category {
    const result = this.db.prepare(
      'INSERT INTO category (name, project_id) VALUES (?, ?)'
    ).run(dto.name, dto.project_id)
    return this.getById(Number(result.lastInsertRowid))!
  }

  rename(id: number, name: string): Category {
    this.db.prepare(
      `UPDATE category SET name = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(name, id)
    return this.getById(id)!
  }

  findByName(projectId: number, name: string): Category | undefined {
    return this.db.prepare(
      'SELECT * FROM category WHERE project_id = ? AND name = ?'
    ).get(projectId, name) as Category | undefined
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM category WHERE id = ?').run(id)
  }
}
