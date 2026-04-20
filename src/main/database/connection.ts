import Database from 'better-sqlite3'
import { runMigrations } from './migrations/001-initial-schema'
import { runMigration002 } from './migrations/002-add-projects'
import { runMigration003 } from './migrations/003-add-test-case-version'
import { runMigration004 } from './migrations/004-restructure-categories'
import { runMigration005 } from './migrations/005-add-plan-summary'
import { runMigration006 } from './migrations/006-add-environment-to-test-cycles'
import { runMigration007 } from './migrations/007-add-test-types'

let dbInstance: Database.Database | null = null

export function createDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
  runMigration002(db)
  runMigration003(db)
  runMigration004(db)
  runMigration005(db)
  runMigration006(db)
  runMigration007(db)
  return db
}

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return dbInstance
}

export function initDatabase(dbPath: string): Database.Database {
  if (dbInstance) return dbInstance
  dbInstance = createDatabase(dbPath)
  return dbInstance
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
