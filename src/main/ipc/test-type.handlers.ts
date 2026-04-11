import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { TestTypeRepository } from '../database/repositories/test-type.repo'
import { getDatabase } from '../database/connection'

export function registerTestTypeHandlers(): void {
  const repo = new TestTypeRepository(getDatabase())

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
}
