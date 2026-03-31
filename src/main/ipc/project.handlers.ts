import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { ProjectRepository } from '../database/repositories/project.repo'
import { getDatabase } from '../database/connection'

export function registerProjectHandlers(): void {
  const repo = new ProjectRepository(getDatabase())

  ipcMain.handle(IPC.PROJECTS.GET_ALL, () => {
    try {
      return wrapSuccess(repo.getAll())
    } catch (e: unknown) {
      return wrapError('PROJ_GET_ALL', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.PROJECTS.GET_BY_ID, (_e, id: number) => {
    try {
      const project = repo.getById(id)
      if (!project) return wrapError('PROJ_NOT_FOUND', 'Project not found')
      return wrapSuccess(project)
    } catch (e: unknown) {
      return wrapError('PROJ_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.PROJECTS.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('PROJ_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.PROJECTS.UPDATE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.update(id, dto))
    } catch (e: unknown) {
      return wrapError('PROJ_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.PROJECTS.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('PROJ_DELETE', (e as Error).message)
    }
  })
}
