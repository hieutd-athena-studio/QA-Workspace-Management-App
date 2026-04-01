import type Database from 'better-sqlite3'

function columnExists(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[]
  return cols.some((c) => c.name === column)
}

export function runMigration003(db: Database.Database): void {
  if (!columnExists(db, 'test_case', 'version')) {
    db.exec(`ALTER TABLE test_case ADD COLUMN version TEXT NOT NULL DEFAULT ''`)
  }
}
