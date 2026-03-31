import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { FolderRepository } from '../database/repositories/folder.repo'
import { getDatabase } from '../database/connection'

export function registerFolderHandlers(): void {
  const repo = new FolderRepository(getDatabase())

  ipcMain.handle(IPC.FOLDERS.GET_ALL, () => {
    try {
      return wrapSuccess(repo.getAll())
    } catch (e: unknown) {
      return wrapError('FOLDER_GET_ALL', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.GET_BY_PROJECT, (_e, projectId: number) => {
    try {
      return wrapSuccess(repo.getByProject(projectId))
    } catch (e: unknown) {
      return wrapError('FOLDER_GET_BY_PROJECT', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.GET_CHILDREN, (_e, parentId: number | null, projectId?: number) => {
    try {
      return wrapSuccess(repo.getChildren(parentId, projectId))
    } catch (e: unknown) {
      return wrapError('FOLDER_GET_CHILDREN', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.GET_BY_ID, (_e, id: number) => {
    try {
      const folder = repo.getById(id)
      if (!folder) return wrapError('FOLDER_NOT_FOUND', 'Folder not found')
      return wrapSuccess(folder)
    } catch (e: unknown) {
      return wrapError('FOLDER_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('FOLDER_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.UPDATE, (_e, id: number, newName: string) => {
    try {
      return wrapSuccess(repo.rename(id, newName))
    } catch (e: unknown) {
      return wrapError('FOLDER_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.MOVE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.move(id, dto))
    } catch (e: unknown) {
      return wrapError('FOLDER_MOVE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.FOLDERS.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('FOLDER_DELETE', (e as Error).message)
    }
  })
}
