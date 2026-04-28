import type Database from 'better-sqlite3'
import type { Project, CreateProjectDTO, UpdateProjectDTO } from '@shared/types'

export class ProjectRepository {
  constructor(private db: Database.Database) {}

  getAll(): Project[] {
    return this.db.prepare('SELECT * FROM project ORDER BY name').all() as Project[]
  }

  getById(id: number): Project | undefined {
    return this.db.prepare('SELECT * FROM project WHERE id = ?').get(id) as Project | undefined
  }

  getByCode(code: string): Project | undefined {
    return this.db.prepare('SELECT * FROM project WHERE code = ?').get(code) as Project | undefined
  }

  create(dto: CreateProjectDTO): Project {
    const code = dto.code.toUpperCase().slice(0, 3)
    const existing = this.getByCode(code)
    if (existing) throw new Error(`Project code "${code}" is already in use`)

    const result = this.db.prepare(
      `INSERT INTO project (name, code, status, description, color) VALUES (?, ?, ?, ?, ?)`
    ).run(dto.name, code, dto.status, dto.description, dto.color ?? null)

    return this.getById(Number(result.lastInsertRowid))!
  }

  update(id: number, dto: UpdateProjectDTO): Project {
    const existing = this.getById(id)
    if (!existing) throw new Error('Project not found')

    if (dto.code) {
      const newCode = dto.code.toUpperCase().slice(0, 3)
      const conflict = this.getByCode(newCode)
      if (conflict && conflict.id !== id) throw new Error(`Project code "${newCode}" is already in use`)
      dto.code = newCode
    }

    this.db.prepare(
      `UPDATE project SET
        name = ?,
        code = ?,
        status = ?,
        description = ?,
        color = ?,
        updated_at = datetime('now')
      WHERE id = ?`
    ).run(
      dto.name ?? existing.name,
      dto.code ?? existing.code,
      dto.status ?? existing.status,
      dto.description ?? existing.description,
      dto.color !== undefined ? dto.color : (existing.color ?? null),
      id
    )

    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM project WHERE id = ?').run(id)
  }
}
