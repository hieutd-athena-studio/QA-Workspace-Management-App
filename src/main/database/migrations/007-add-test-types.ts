import type Database from 'better-sqlite3'

export function runMigration007(db: Database.Database): void {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
  if (tables.some(t => t.name === 'test_type')) return

  db.exec(`
    CREATE TABLE test_type (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX idx_test_type_project ON test_type(project_id);

    CREATE TABLE test_type_case (
      test_type_id INTEGER NOT NULL REFERENCES test_type(id) ON DELETE CASCADE,
      test_case_id INTEGER NOT NULL REFERENCES test_case(id) ON DELETE CASCADE,
      PRIMARY KEY (test_type_id, test_case_id)
    );
  `)
}
