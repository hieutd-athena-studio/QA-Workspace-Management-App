import type Database from 'better-sqlite3'

export function runMigration006(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('test_cycle')").all() as Array<{ name: string }>
  const hasColumn = columns.some((c) => c.name === 'environment')
  if (hasColumn) return

  db.exec("ALTER TABLE test_cycle ADD COLUMN environment TEXT")
}
