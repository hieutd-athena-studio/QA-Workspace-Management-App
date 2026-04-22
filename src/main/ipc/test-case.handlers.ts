import { ipcMain, dialog } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import type { TestStep } from '@shared/types'
import { TestCaseRepository } from '../database/repositories/test-case.repo'
import { CategoryRepository } from '../database/repositories/category.repo'
import { SubcategoryRepository } from '../database/repositories/subcategory.repo'
import { ProjectRepository } from '../database/repositories/project.repo'
import { getDatabase } from '../database/connection'


export function registerTestCaseHandlers(): void {
  const db = getDatabase()
  const repo = new TestCaseRepository(db)
  const projectRepo = new ProjectRepository(db)

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

  ipcMain.handle(IPC.TEST_CASES.EXPORT_JSON, async (_e, projectId: number) => {
    try {
      const rows = repo.getByProjectWithHierarchy(projectId)
      const project = projectRepo.getById(projectId)
      const projectCode = project?.code ?? 'export'
      const date = new Date().toISOString().slice(0, 10)

      const result = await dialog.showSaveDialog({
        defaultPath: `${projectCode}-Test-Cases-${date}.json`,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })
      if (result.canceled || !result.filePath) {
        return wrapError('TC_EXPORT_CANCELLED', 'Export cancelled')
      }

      const payload = {
        version: '1.0',
        project_code: projectCode,
        exported_at: new Date().toISOString(),
        test_cases: rows.map(tc => ({
          category: tc.category_name,
          subcategory: tc.subcategory_name,
          title: tc.title,
          description: tc.description || '',
          steps: tc.steps.map((s: TestStep) => ({ step: s.step, action: s.action, expected: s.expected })),
          expected_result: tc.expected_result || '',
          version: tc.version || '1.0'
        }))
      }

      writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8')
      return wrapSuccess({ count: rows.length, path: result.filePath })
    } catch (e: unknown) {
      return wrapError('TC_EXPORT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CASES.IMPORT_JSON, async (_e, projectId: number) => {
    try {
      const fileResult = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })
      if (fileResult.canceled || !fileResult.filePaths.length) {
        return wrapError('TC_IMPORT_CANCELLED', 'Import cancelled')
      }

      const content = readFileSync(fileResult.filePaths[0], 'utf-8')
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        return wrapError('TC_IMPORT', 'Invalid JSON file')
      }

      const data = parsed as { test_cases?: unknown[] }
      if (!Array.isArray(data.test_cases) || data.test_cases.length === 0) {
        return wrapError('TC_IMPORT', 'JSON file has no test_cases array')
      }

      const catRepo = new CategoryRepository(db)
      const subRepo = new SubcategoryRepository(db)
      const catCache = new Map<string, number>()
      const subCache = new Map<string, number>()
      let importedCount = 0

      const importAll = db.transaction(() => {
        for (const raw of data.test_cases!) {
          const tc = raw as Record<string, unknown>
          const catName = String(tc.category ?? '').trim()
          const subName = String(tc.subcategory ?? '').trim()
          const title = String(tc.title ?? '').trim()
          if (!catName || !subName || !title) continue

          let categoryId = catCache.get(catName)
          if (categoryId === undefined) {
            const existing = catRepo.findByName(projectId, catName)
            categoryId = existing ? existing.id : catRepo.create({ name: catName, project_id: projectId }).id
            catCache.set(catName, categoryId)
          }

          const subKey = `${categoryId}::${subName}`
          let subcategoryId = subCache.get(subKey)
          if (subcategoryId === undefined) {
            const existing = subRepo.findByName(categoryId, subName)
            subcategoryId = existing ? existing.id : subRepo.create({ name: subName, category_id: categoryId, project_id: projectId }).id
            subCache.set(subKey, subcategoryId)
          }

          const steps: TestStep[] = Array.isArray(tc.steps)
            ? (tc.steps as Record<string, unknown>[]).map((s, idx) => ({
                step: idx + 1,
                action: String(s.action ?? '').trim(),
                expected: String(s.expected ?? '').trim()
              }))
            : []

          repo.create({
            title,
            description: String(tc.description ?? '').trim(),
            steps,
            expected_result: String(tc.expected_result ?? '').trim(),
            version: String(tc.version ?? '1.0').trim() || '1.0',
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
