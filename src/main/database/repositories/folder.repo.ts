import type Database from 'better-sqlite3'
import type { Folder, CreateFolderDTO, UpdateFolderDTO, MoveFolderDTO } from '@shared/types'

export class FolderRepository {
  constructor(private db: Database.Database) {}

  getAll(): Folder[] {
    return this.db.prepare('SELECT * FROM folder ORDER BY path').all() as Folder[]
  }

  getChildren(parentId: number | null): Folder[] {
    if (parentId === null) {
      return this.db.prepare('SELECT * FROM folder WHERE parent_id IS NULL ORDER BY name').all() as Folder[]
    }
    return this.db.prepare('SELECT * FROM folder WHERE parent_id = ? ORDER BY name').all(parentId) as Folder[]
  }

  getById(id: number): Folder | undefined {
    return this.db.prepare('SELECT * FROM folder WHERE id = ?').get(id) as Folder | undefined
  }

  create(dto: CreateFolderDTO): Folder {
    let path: string
    if (dto.parent_id) {
      const parent = this.getById(dto.parent_id)
      if (!parent) throw new Error('Parent folder not found')
      path = `${parent.path}/${dto.name}`
    } else {
      path = `/${dto.name}`
    }

    const result = this.db.prepare(
      'INSERT INTO folder (name, parent_id, path) VALUES (?, ?, ?)'
    ).run(dto.name, dto.parent_id, path)

    return this.getById(Number(result.lastInsertRowid))!
  }

  rename(id: number, newName: string): Folder {
    const folder = this.getById(id)
    if (!folder) throw new Error('Folder not found')

    const oldPath = folder.path
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'))
    const newPath = `${parentPath}/${newName}`

    const updateAll = this.db.transaction(() => {
      // Update all descendants' paths
      this.db.prepare(
        `UPDATE folder SET path = REPLACE(path, ?, ?), updated_at = datetime('now') WHERE path LIKE ?`
      ).run(oldPath, newPath, `${oldPath}/%`)

      // Update the folder itself
      this.db.prepare(
        `UPDATE folder SET name = ?, path = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(newName, newPath, id)
    })

    updateAll()
    return this.getById(id)!
  }

  move(id: number, dto: MoveFolderDTO): Folder {
    const folder = this.getById(id)
    if (!folder) throw new Error('Folder not found')

    const oldPath = folder.path
    let newParentPath: string

    if (dto.new_parent_id) {
      const newParent = this.getById(dto.new_parent_id)
      if (!newParent) throw new Error('New parent folder not found')
      newParentPath = newParent.path
    } else {
      newParentPath = ''
    }

    const newPath = `${newParentPath}/${folder.name}`

    const moveAll = this.db.transaction(() => {
      // Update all descendants' paths
      this.db.prepare(
        `UPDATE folder SET path = REPLACE(path, ?, ?), updated_at = datetime('now') WHERE path LIKE ?`
      ).run(oldPath, newPath, `${oldPath}/%`)

      // Update the folder itself
      this.db.prepare(
        `UPDATE folder SET parent_id = ?, path = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(dto.new_parent_id, newPath, id)
    })

    moveAll()
    return this.getById(id)!
  }

  delete(id: number): void {
    this.db.prepare('DELETE FROM folder WHERE id = ?').run(id)
  }
}
