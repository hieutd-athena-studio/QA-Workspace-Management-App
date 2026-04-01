import type Database from 'better-sqlite3'

export function runMigrations(db: Database.Database): void {
  db.exec(`
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

    CREATE TABLE IF NOT EXISTS test_plan (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      version     TEXT    NOT NULL,
      start_date  TEXT    NOT NULL,
      end_date    TEXT    NOT NULL,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_cycle (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      build_name    TEXT    NOT NULL,
      test_plan_id  INTEGER NOT NULL REFERENCES test_plan(id) ON DELETE CASCADE,
      start_date    TEXT,
      end_date      TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_test_cycle_plan ON test_cycle(test_plan_id);

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

    CREATE TABLE IF NOT EXISTS test_report (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      test_cycle_id  INTEGER NOT NULL REFERENCES test_cycle(id) ON DELETE CASCADE,
      generated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      format         TEXT    NOT NULL CHECK (format IN ('pdf', 'html')),
      file_path      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_report_cycle ON test_report(test_cycle_id);
  `)
}
