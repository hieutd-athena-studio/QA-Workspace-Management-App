import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { SubcategoryRepository } from '../database/repositories/subcategory.repo'
import { getDatabase } from '../database/connection'

export function registerSubcategoryHandlers(): void {
  const repo = new SubcategoryRepository(getDatabase())

  ipcMain.handle(IPC.SUBCATEGORIES.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('SUBCAT_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.GET_BY_CATEGORY, (_e, categoryId: number) => {
    try {
      return wrapSuccess(repo.getByCategory(categoryId))
    } catch (e: unknown) {
      return wrapError('SUBCAT_GET_BY_CATEGORY', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.GET_BY_ID, (_e, id: number) => {
    try {
      const sub = repo.getById(id)
      if (!sub) return wrapError('SUBCAT_NOT_FOUND', 'Sub-category not found')
      return wrapSuccess(sub)
    } catch (e: unknown) {
      return wrapError('SUBCAT_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('SUBCAT_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.RENAME, (_e, id: number, name: string) => {
    try {
      return wrapSuccess(repo.rename(id, name))
    } catch (e: unknown) {
      return wrapError('SUBCAT_RENAME', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.SUBCATEGORIES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('SUBCAT_DELETE', (e as Error).message)
    }
  })
}
