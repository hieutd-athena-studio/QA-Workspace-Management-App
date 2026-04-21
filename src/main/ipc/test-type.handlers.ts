import { ipcMain, dialog } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { TestTypeRepository } from '../database/repositories/test-type.repo'
import { ProjectRepository } from '../database/repositories/project.repo'
import { getDatabase } from '../database/connection'

export function registerTestTypeHandlers(): void {
  const db = getDatabase()
  const repo = new TestTypeRepository(db)
  const projectRepo = new ProjectRepository(db)

  ipcMain.handle(IPC.TEST_TYPES.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('TT_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.GET_BY_ID, (_e, id: number) => {
    try {
      const type = repo.getById(id)
      if (!type) return wrapError('TT_NOT_FOUND', 'Test type not found')
      return wrapSuccess(type)
    } catch (e: unknown) {
      return wrapError('TT_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('TT_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.UPDATE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.update(id, dto))
    } catch (e: unknown) {
      return wrapError('TT_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('TT_DELETE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.ADD_TEST_CASE, (_e, testTypeId: number, testCaseId: number) => {
    try {
      repo.addTestCase(testTypeId, testCaseId)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('TT_ADD_CASE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.REMOVE_TEST_CASE, (_e, testTypeId: number, testCaseId: number) => {
    try {
      repo.removeTestCase(testTypeId, testCaseId)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('TT_REMOVE_CASE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.GET_TEST_CASE_IDS, (_e, testTypeId: number) => {
    try {
      return wrapSuccess(repo.getTestCaseIds(testTypeId))
    } catch (e: unknown) {
      return wrapError('TT_GET_CASES', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.EXPORT, async (_e, projectId: number, testTypeIds: number[]) => {
    try {
      const project = projectRepo.getById(projectId)
      if (!project) return wrapError('TT_EXPORT', 'Project not found')

      const exportData = testTypeIds.map(id => {
        const tt = repo.getById(id)
        if (!tt) return null
        const cases = repo.getTestCasesWithDisplayIds(id)
        return { name: tt.name, case_display_ids: cases.map(c => c.display_id) }
      }).filter(Boolean)

      const date = new Date().toISOString().slice(0, 10)
      const defaultPath = `${project.code}-Test-Types-${date}.json`

      const result = await dialog.showSaveDialog({
        defaultPath,
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })
      if (result.canceled || !result.filePath) return wrapError('TT_EXPORT_CANCELLED', 'Export cancelled')

      const payload = { version: '1', project_code: project.code, test_types: exportData }
      writeFileSync(result.filePath, JSON.stringify(payload, null, 2), 'utf-8')
      return wrapSuccess({ count: exportData.length, path: result.filePath })
    } catch (e: unknown) {
      return wrapError('TT_EXPORT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_TYPES.IMPORT, async (_e, projectId: number) => {
    try {
      const fileResult = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      })
      if (fileResult.canceled || !fileResult.filePaths.length) return wrapError('TT_IMPORT_CANCELLED', 'Import cancelled')

      const content = readFileSync(fileResult.filePaths[0], 'utf-8')
      const data = JSON.parse(content) as { version: string; test_types: Array<{ name: string; case_display_ids: string[] }> }

      if (!data.test_types || !Array.isArray(data.test_types)) {
        return wrapError('TT_IMPORT', 'Invalid file format')
      }

      // Collect all display IDs referenced in the file
      const allDisplayIds = Array.from(new Set(data.test_types.flatMap(tt => tt.case_display_ids)))
      const found = repo.getTestCaseIdsByDisplayIds(projectId, allDisplayIds)
      const foundSet = new Set(found.map(r => r.display_id))
      const missing = allDisplayIds.filter(id => !foundSet.has(id))

      if (missing.length > 0) {
        return wrapError('TT_IMPORT_MISSING_CASES',
          `${missing.length} test case(s) not found in this project. Import test cases first.\nMissing: ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ` (+${missing.length - 10} more)` : ''}`)
      }

      const displayIdToId = new Map(found.map(r => [r.display_id, r.id]))
      let importedCount = 0

      for (const ttData of data.test_types) {
        const created = repo.create({ name: ttData.name, project_id: projectId })
        for (const displayId of ttData.case_display_ids) {
          const caseId = displayIdToId.get(displayId)
          if (caseId !== undefined) repo.addTestCase(created.id, caseId)
        }
        importedCount++
      }

      return wrapSuccess({ count: importedCount })
    } catch (e: unknown) {
      return wrapError('TT_IMPORT', (e as Error).message)
    }
  })
}
