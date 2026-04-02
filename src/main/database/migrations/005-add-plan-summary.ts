import type Database from 'better-sqlite3'

export function runMigration005(db: Database.Database): void {
  const columns = db.prepare("PRAGMA table_info('test_plan')").all() as Array<{ name: string }>
  const hasColumn = columns.some((c) => c.name === 'summary')
  if (hasColumn) return

  db.exec("ALTER TABLE test_plan ADD COLUMN summary TEXT NOT NULL DEFAULT ''")
}
