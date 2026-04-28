import type Database from 'better-sqlite3'

export function runMigration008(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('project')").all() as Array<{ name: string }>
  const hasColumn = columns.some((c) => c.name === 'color')
  if (hasColumn) return
  db.exec('ALTER TABLE project ADD COLUMN color TEXT')
}
