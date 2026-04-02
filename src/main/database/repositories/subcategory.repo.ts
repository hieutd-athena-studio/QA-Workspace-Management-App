import type Database from 'better-sqlite3'
import type { Subcategory, CreateSubcategoryDTO } from '@shared/types'

export class SubcategoryRepository {
  constructor(private db: Database.Database) {}

  getByProject(projectId: number): Subcategory[] {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE project_id = ? ORDER BY name'
    ).all(projectId) as Subcategory[]
  }

  getByCategory(categoryId: number): Subcategory[] {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE category_id = ? ORDER BY name'
    ).all(categoryId) as Subcategory[]
  }

  getById(id: number): Subcategory | undefined {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE id = ?'
    ).get(id) as Subcategory | undefined
  }

  create(dto: CreateSubcategoryDTO): Subcategory {
    const result = this.db.prepare(
      'INSERT INTO subcategory (name, category_id, project_id) VALUES (?, ?, ?)'
    ).run(dto.name, dto.category_id, dto.project_id)
    return this.getById(Number(result.lastInsertRowid))!
  }

  rename(id: number, name: string): Subcategory {
    this.db.prepare(
      `UPDATE subcategory SET name = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(name, id)
    return this.getById(id)!
  }

  findByName(categoryId: number, name: string): Subcategory | undefined {
    return this.db.prepare(
      'SELECT * FROM subcategory WHERE category_id = ? AND name = ?'
    ).get(categoryId, name) as Subcategory | undefined
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM subcategory WHERE id = ?').run(id)
  }
}
