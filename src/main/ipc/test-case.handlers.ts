import { ipcMain, dialog } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import type { TestStep } from '@shared/types'
import { TestCaseRepository } from '../database/repositories/test-case.repo'
import { CategoryRepository } from '../database/repositories/category.repo'
import { SubcategoryRepository } from '../database/repositories/subcategory.repo'
import { getDatabase } from '../database/connection'

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        current += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
  }
  fields.push(current)
  return fields
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function registerTestCaseHandlers(): void {
  const db = getDatabase()
  const repo = new TestCaseRepository(db)

  ipcMain.handle(IPC.TEST_CASES.GET_BY_SUBCATEGORY, (_e, subcategoryId: number) => {
    try {
      return wrapSuccess(repo.getBySubcategory(subcategoryId))
    } catch (e: unknown) {
      return wrapError('TC_GET_BY_SUBCATEGORY', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('TC_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.GET_BY_ID, (_e, id: number) => {
    try {
      const tc = repo.getById(id)
      if (!tc) return wrapError('TC_NOT_FOUND', 'Test case not found')
      return wrapSuccess(tc)
    } catch (e: unknown) {
      return wrapError('TC_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('TC_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.UPDATE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.update(id, dto))
    } catch (e: unknown) {
      return wrapError('TC_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('TC_DELETE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.SEARCH, (_e, query: string, projectId?: number) => {
    try {
      return wrapSuccess(repo.search(query, projectId))
    } catch (e: unknown) {
      return wrapError('TC_SEARCH', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.EXPORT_CSV, async (_e, projectId: number) => {
    try {
      const rows = repo.getByProjectWithHierarchy(projectId)

      const result = await dialog.showSaveDialog({
        defaultPath: `test-cases-export-${new Date().toISOString().slice(0, 10)}.csv`,
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      })
      if (result.canceled || !result.filePath) {
        return wrapError('TC_EXPORT_CANCELLED', 'Export cancelled')
      }

      const header = 'Category,Subcategory,Title,Description,Steps,Expected Result,Version'
      const lines = rows.map(tc => {
        const stepsStr = tc.steps.map((s: TestStep) => `${s.step}. ${s.action} -> ${s.expected}`).join(' | ')
        return [
          escapeCSV(tc.category_name),
          escapeCSV(tc.subcategory_name),
          escapeCSV(tc.title),
          escapeCSV(tc.description || ''),
          escapeCSV(stepsStr),
          escapeCSV(tc.expected_result || ''),
          escapeCSV(tc.version || '')
        ].join(',')
      })

      writeFileSync(result.filePath, [header, ...lines].join('\n'), 'utf-8')
      return wrapSuccess({ count: rows.length, path: result.filePath })
    } catch (e: unknown) {
      return wrapError('TC_EXPORT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.IMPORT_CSV, async (_e, projectId: number) => {
    try {
      const fileResult = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      })
      if (fileResult.canceled || !fileResult.filePaths.length) {
        return wrapError('TC_IMPORT_CANCELLED', 'Import cancelled')
      }

      const content = readFileSync(fileResult.filePaths[0], 'utf-8')
      const lines = content.split(/\r?\n/).filter(l => l.trim())
      if (lines.length < 2) {
        return wrapError('TC_IMPORT', 'CSV file is empty or has no data rows')
      }

      // Parse header to find column indices
      const headerFields = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
      const colIdx = {
        category: headerFields.indexOf('category'),
        subcategory: Math.max(headerFields.indexOf('subcategory'), headerFields.indexOf('sub-category')),
        title: headerFields.indexOf('title'),
        description: headerFields.indexOf('description'),
        steps: headerFields.indexOf('steps'),
        expectedResult: Math.max(headerFields.indexOf('expected result'), headerFields.indexOf('expected_result')),
        version: headerFields.indexOf('version')
      }

      if (colIdx.category === -1 || colIdx.subcategory === -1 || colIdx.title === -1) {
        return wrapError('TC_IMPORT', 'CSV must have Category, Subcategory, and Title columns')
      }

      const catRepo = new CategoryRepository(db)
      const subRepo = new SubcategoryRepository(db)

      // Cache for category/subcategory lookups
      const catCache = new Map<string, number>()
      const subCache = new Map<string, number>()

      let importedCount = 0

      const importAll = db.transaction(() => {
        for (let i = 1; i < lines.length; i++) {
          const fields = parseCSVLine(lines[i])
          const catName = (fields[colIdx.category] ?? '').trim()
          const subName = (fields[colIdx.subcategory] ?? '').trim()
          const title = (fields[colIdx.title] ?? '').trim()

          if (!catName || !subName || !title) continue

          // Resolve or create category
          let categoryId = catCache.get(catName)
          if (categoryId === undefined) {
            const existing = catRepo.findByName(projectId, catName)
            if (existing) {
              categoryId = existing.id
            } else {
              const created = catRepo.create({ name: catName, project_id: projectId })
              categoryId = created.id
            }
            catCache.set(catName, categoryId)
          }

          // Resolve or create subcategory
          const subKey = `${categoryId}::${subName}`
          let subcategoryId = subCache.get(subKey)
          if (subcategoryId === undefined) {
            const existing = subRepo.findByName(categoryId, subName)
            if (existing) {
              subcategoryId = existing.id
            } else {
              const created = subRepo.create({ name: subName, category_id: categoryId, project_id: projectId })
              subcategoryId = created.id
            }
            subCache.set(subKey, subcategoryId)
          }

          // Parse steps
          const rawSteps = colIdx.steps !== -1 ? (fields[colIdx.steps] ?? '').trim() : ''
          const steps: TestStep[] = rawSteps
            ? rawSteps.split(' | ').map((s, idx) => {
                const match = s.match(/^\d+\.\s*(.+?)\s*->\s*(.+)$/)
                if (match) return { step: idx + 1, action: match[1].trim(), expected: match[2].trim() }
                return { step: idx + 1, action: s.trim(), expected: '' }
              })
            : []

          const description = colIdx.description !== -1 ? (fields[colIdx.description] ?? '').trim() : ''
          const expectedResult = colIdx.expectedResult !== -1 ? (fields[colIdx.expectedResult] ?? '').trim() : ''
          const version = colIdx.version !== -1 ? (fields[colIdx.version] ?? '').trim() : '1.0'

          repo.create({
            title,
            description,
            steps,
            expected_result: expectedResult,
            version: version || '1.0',
            subcategory_id: subcategoryId
          })
          importedCount++
        }
      })

      importAll()
      return wrapSuccess({ count: importedCount })
    } catch (e: unknown) {
      return wrapError('TC_IMPORT', (e as Error).message)
    }
  })
}
