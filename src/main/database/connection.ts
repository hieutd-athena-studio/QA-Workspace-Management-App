import Database from 'better-sqlite3'
import { runMigrations } from './migrations/001-initial-schema'

let dbInstance: Database.Database | null = null

export function createDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
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
