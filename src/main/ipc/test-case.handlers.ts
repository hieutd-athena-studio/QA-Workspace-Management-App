import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { TestCaseRepository } from '../database/repositories/test-case.repo'
import { getDatabase } from '../database/connection'

export function registerTestCaseHandlers(): void {
  const repo = new TestCaseRepository(getDatabase())

  ipcMain.handle(IPC.TEST_CASES.GET_BY_FOLDER, (_e, folderId: number) => {
    try {
      return wrapSuccess(repo.getByFolder(folderId))
    } catch (e: unknown) {
      return wrapError('TC_GET_BY_FOLDER', (e as Error).message)
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
}
