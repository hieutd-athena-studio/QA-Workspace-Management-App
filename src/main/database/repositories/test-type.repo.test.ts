import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { TestTypeRepository } from './test-type.repo'

function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE project (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE subcategory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES category(id) ON DELETE CASCADE,
      project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE test_case (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      display_id TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      steps TEXT NOT NULL DEFAULT '[]',
      expected_result TEXT NOT NULL DEFAULT '',
      version TEXT NOT NULL DEFAULT '1.0',
      subcategory_id INTEGER NOT NULL REFERENCES subcategory(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE test_type (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE test_type_case (
      test_type_id INTEGER NOT NULL REFERENCES test_type(id) ON DELETE CASCADE,
      test_case_id INTEGER NOT NULL REFERENCES test_case(id) ON DELETE CASCADE,
      PRIMARY KEY (test_type_id, test_case_id)
    );
  `)

  db.prepare('INSERT INTO project (name, code) VALUES (?, ?)').run('Test Project', 'TST')
  const cat = db.prepare('INSERT INTO category (name, project_id) VALUES (?, ?)').run('Auth', 1)
  const sub = db.prepare('INSERT INTO subcategory (name, category_id, project_id) VALUES (?, ?, ?)').run('Login', cat.lastInsertRowid, 1)
  db.prepare('INSERT INTO test_case (display_id, title, subcategory_id) VALUES (?, ?, ?)').run('TST-TC001', 'Valid login', sub.lastInsertRowid)
  db.prepare('INSERT INTO test_case (display_id, title, subcategory_id) VALUES (?, ?, ?)').run('TST-TC002', 'Invalid password', sub.lastInsertRowid)

  return db
}

describe('TestTypeRepository', () => {
  let db: Database.Database
  let repo: TestTypeRepository

  beforeEach(() => {
    db = createTestDb()
    repo = new TestTypeRepository(db)
  })

  afterEach(() => {
    db.close()
  })

  describe('create', () => {
    it('creates a new test type with zero test cases', () => {
      const result = repo.create({ name: 'Smoke Testing', project_id: 1 })
      expect(result.id).toBeDefined()
      expect(result.name).toBe('Smoke Testing')
      expect(result.project_id).toBe(1)
      expect(result.test_case_count).toBe(0)
      expect(result.created_at).toBeDefined()
    })
  })

  describe('getByProject', () => {
    it('returns empty array when no test types exist', () => {
      expect(repo.getByProject(1)).toEqual([])
    })

    it('returns test types with correct case counts', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.addTestCase(type.id, 2)

      const results = repo.getByProject(1)
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Smoke Testing')
      expect(results[0].test_case_count).toBe(2)
    })

    it('only returns test types for the given project', () => {
      db.prepare('INSERT INTO project (name, code) VALUES (?, ?)').run('Other Project', 'OTH')
      repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.create({ name: 'Regression', project_id: 2 })

      expect(repo.getByProject(1)).toHaveLength(1)
      expect(repo.getByProject(2)).toHaveLength(1)
    })

    it('returns test types ordered by name', () => {
      repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.create({ name: 'Functional Testing', project_id: 1 })
      repo.create({ name: 'Regression Testing', project_id: 1 })

      const results = repo.getByProject(1)
      expect(results.map(r => r.name)).toEqual([
        'Functional Testing',
        'Regression Testing',
        'Smoke Testing'
      ])
    })
  })

  describe('getById', () => {
    it('returns undefined for non-existent id', () => {
      expect(repo.getById(999)).toBeUndefined()
    })

    it('returns the test type with case count', () => {
      const created = repo.create({ name: 'Functional Testing', project_id: 1 })
      const found = repo.getById(created.id)
      expect(found).toBeDefined()
      expect(found!.name).toBe('Functional Testing')
      expect(found!.test_case_count).toBe(0)
    })
  })

  describe('update', () => {
    it('renames a test type', () => {
      const created = repo.create({ name: 'Old Name', project_id: 1 })
      const updated = repo.update(created.id, { name: 'New Name' })
      expect(updated.name).toBe('New Name')
    })

    it('throws if test type not found', () => {
      expect(() => repo.update(999, { name: 'X' })).toThrow()
    })
  })

  describe('delete', () => {
    it('deletes a test type', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.delete(type.id)
      expect(repo.getById(type.id)).toBeUndefined()
    })

    it('cascades deletion to test_type_case links', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.delete(type.id)
      expect(repo.getTestCaseIds(type.id)).toHaveLength(0)
    })
  })

  describe('addTestCase', () => {
    it('links a test case to a test type', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      expect(repo.getTestCaseIds(type.id)).toContain(1)
    })

    it('ignores duplicate additions (idempotent)', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.addTestCase(type.id, 1)
      expect(repo.getTestCaseIds(type.id)).toHaveLength(1)
    })

    it('updates the test_case_count after adding', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.addTestCase(type.id, 2)
      expect(repo.getById(type.id)!.test_case_count).toBe(2)
    })
  })

  describe('removeTestCase', () => {
    it('unlinks a test case from a test type', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.removeTestCase(type.id, 1)
      expect(repo.getTestCaseIds(type.id)).toHaveLength(0)
    })

    it('is a no-op when the case is not linked', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      expect(() => repo.removeTestCase(type.id, 999)).not.toThrow()
    })
  })

  describe('getTestCaseIds', () => {
    it('returns all linked test case ids', () => {
      const type = repo.create({ name: 'Regression Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.addTestCase(type.id, 2)
      const ids = repo.getTestCaseIds(type.id)
      expect(ids).toHaveLength(2)
      expect(ids).toContain(1)
      expect(ids).toContain(2)
    })

    it('returns empty array for test type with no cases', () => {
      const type = repo.create({ name: 'Empty Type', project_id: 1 })
      expect(repo.getTestCaseIds(type.id)).toEqual([])
    })
  })

  describe('cascade behavior', () => {
    it('deleting a test case removes it from test type links', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      db.prepare('DELETE FROM test_case WHERE id = 1').run()
      expect(repo.getTestCaseIds(type.id)).toHaveLength(0)
    })
  })

  describe('getTestCasesWithDisplayIds', () => {
    it('returns display_id and title for linked test cases', () => {
      const type = repo.create({ name: 'Smoke Testing', project_id: 1 })
      repo.addTestCase(type.id, 1)
      repo.addTestCase(type.id, 2)
      const cases = repo.getTestCasesWithDisplayIds(type.id)
      expect(cases).toHaveLength(2)
      expect(cases[0]).toHaveProperty('display_id')
      expect(cases[0]).toHaveProperty('title')
      expect(cases.map(c => c.display_id)).toContain('TST-TC001')
      expect(cases.map(c => c.display_id)).toContain('TST-TC002')
    })

    it('returns empty array when no cases linked', () => {
      const type = repo.create({ name: 'Empty', project_id: 1 })
      expect(repo.getTestCasesWithDisplayIds(type.id)).toEqual([])
    })
  })

  describe('getTestCaseIdsByDisplayIds', () => {
    it('returns id+display_id for matching display_ids in project', () => {
      const result = repo.getTestCaseIdsByDisplayIds(1, ['TST-TC001', 'TST-TC002'])
      expect(result).toHaveLength(2)
      expect(result.map(r => r.display_id)).toContain('TST-TC001')
      expect(result.map(r => r.display_id)).toContain('TST-TC002')
      expect(result[0]).toHaveProperty('id')
    })

    it('returns only matching entries (ignores unknown display_ids)', () => {
      const result = repo.getTestCaseIdsByDisplayIds(1, ['TST-TC001', 'TST-TC999'])
      expect(result).toHaveLength(1)
      expect(result[0].display_id).toBe('TST-TC001')
    })

    it('returns empty array when no matches', () => {
      expect(repo.getTestCaseIdsByDisplayIds(1, ['TST-TC999'])).toEqual([])
    })

    it('does not return test cases from a different project', () => {
      db.prepare('INSERT INTO project (name, code) VALUES (?, ?)').run('Other', 'OTH')
      const otherCat = db.prepare('INSERT INTO category (name, project_id) VALUES (?, ?)').run('X', 2)
      const otherSub = db.prepare('INSERT INTO subcategory (name, category_id, project_id) VALUES (?, ?, ?)').run('Y', otherCat.lastInsertRowid, 2)
      db.prepare('INSERT INTO test_case (display_id, title, subcategory_id) VALUES (?, ?, ?)').run('TST-TC001', 'Dup', otherSub.lastInsertRowid)

      const result = repo.getTestCaseIdsByDisplayIds(2, ['TST-TC001'])
      expect(result).toHaveLength(1)
      expect(result[0].id).not.toBe(1)
    })
  })
})
