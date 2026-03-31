import type Database from 'better-sqlite3'

function columnExists(db: Database.Database, table: string, column: string): boolean {
  const cols = db.pragma(`table_info(${table})`) as { name: string }[]
  return cols.some((c) => c.name === column)
}

export function runMigration002(db: Database.Database): void {
  // Create project table
  db.exec(`
    CREATE TABLE IF NOT EXISTS project (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      code        TEXT    NOT NULL UNIQUE,
      status      TEXT    NOT NULL DEFAULT 'On-going'
                  CHECK (status IN ('On-going', 'On-hold', 'Dropped')),
      description TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_project_code ON project(code);
  `)

  // Add project_id to folder
  if (!columnExists(db, 'folder', 'project_id')) {
    db.exec(`ALTER TABLE folder ADD COLUMN project_id INTEGER REFERENCES project(id) ON DELETE CASCADE`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_folder_project ON folder(project_id)`)
  }

  // Add project_id + display_id to test_plan
  if (!columnExists(db, 'test_plan', 'project_id')) {
    db.exec(`ALTER TABLE test_plan ADD COLUMN project_id INTEGER REFERENCES project(id) ON DELETE CASCADE`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_test_plan_project ON test_plan(project_id)`)
  }
  if (!columnExists(db, 'test_plan', 'display_id')) {
    db.exec(`ALTER TABLE test_plan ADD COLUMN display_id TEXT NOT NULL DEFAULT ''`)
  }

  // Add display_id to test_case
  if (!columnExists(db, 'test_case', 'display_id')) {
    db.exec(`ALTER TABLE test_case ADD COLUMN display_id TEXT NOT NULL DEFAULT ''`)
  }

  // Add display_id to test_cycle
  if (!columnExists(db, 'test_cycle', 'display_id')) {
    db.exec(`ALTER TABLE test_cycle ADD COLUMN display_id TEXT NOT NULL DEFAULT ''`)
  }
}
