import type Database from 'better-sqlite3'

function tableExists(db: Database.Database, table: string): boolean {
  const row = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
  ).get(table)
  return !!row
}

export function runMigration004(db: Database.Database): void {
  if (tableExists(db, 'category')) return

  db.transaction(() => {
    db.exec(`
      DROP TABLE IF EXISTS test_case_assignment;
      DROP TABLE IF EXISTS test_case;
      DROP TABLE IF EXISTS folder;

      CREATE TABLE IF NOT EXISTS category (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_category_project ON category(project_id);

      CREATE TABLE IF NOT EXISTS subcategory (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
        project_id  INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_subcategory_category ON subcategory(category_id);
      CREATE INDEX IF NOT EXISTS idx_subcategory_project ON subcategory(project_id);

      CREATE TABLE IF NOT EXISTS test_case (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        display_id      TEXT    NOT NULL DEFAULT '',
        title           TEXT    NOT NULL,
        description     TEXT    NOT NULL DEFAULT '',
        steps           TEXT    NOT NULL DEFAULT '[]',
        expected_result TEXT    NOT NULL DEFAULT '',
        version         TEXT    NOT NULL DEFAULT '',
        subcategory_id  INTEGER NOT NULL REFERENCES subcategory(id) ON DELETE CASCADE,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_test_case_subcategory ON test_case(subcategory_id);

      CREATE TABLE IF NOT EXISTS test_case_assignment (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        test_cycle_id  INTEGER NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
        test_case_id   INTEGER NOT NULL REFERENCES test_case(id) ON DELETE CASCADE,
        status         TEXT    NOT NULL DEFAULT 'Unexecuted'
                       CHECK (status IN ('Pass', 'Fail', 'Blocked', 'Unexecuted')),
        bug_ref        TEXT,
        executed_at    TEXT,
        created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        UNIQUE(test_cycle_id, test_case_id)
      );
      CREATE INDEX IF NOT EXISTS idx_assignment_cycle ON test_case_assignment(test_cycle_id);
      CREATE INDEX IF NOT EXISTS idx_assignment_test_case ON test_case_assignment(test_case_id);
    `)
  })()
}
