import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { CategoryRepository } from '../database/repositories/category.repo'
import { getDatabase } from '../database/connection'

export function registerCategoryHandlers(): void {
  const repo = new CategoryRepository(getDatabase())

  ipcMain.handle(IPC.CATEGORIES.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('CAT_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.GET_BY_ID, (_e, id: number) => {
    try {
      const cat = repo.getById(id)
      if (!cat) return wrapError('CAT_NOT_FOUND', 'Category not found')
      return wrapSuccess(cat)
    } catch (e: unknown) {
      return wrapError('CAT_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('CAT_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.RENAME, (_e, id: number, name: string) => {
    try {
      return wrapSuccess(repo.rename(id, name))
    } catch (e: unknown) {
      return wrapError('CAT_RENAME', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.CATEGORIES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('CAT_DELETE', (e as Error).message)
    }
  })
}
