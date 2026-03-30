import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { TestPlanRepository } from '../database/repositories/test-plan.repo'
import { getDatabase } from '../database/connection'

export function registerTestPlanHandlers(): void {
  const repo = new TestPlanRepository(getDatabase())

  ipcMain.handle(IPC.TEST_PLANS.GET_ALL, () => {
    try {
      return wrapSuccess(repo.getAll())
    } catch (e: unknown) {
      return wrapError('TP_GET_ALL', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_PLANS.GET_BY_ID, (_e, id: number) => {
    try {
      const plan = repo.getById(id)
      if (!plan) return wrapError('TP_NOT_FOUND', 'Test plan not found')
      return wrapSuccess(plan)
    } catch (e: unknown) {
      return wrapError('TP_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_PLANS.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('TP_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_PLANS.UPDATE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.update(id, dto))
    } catch (e: unknown) {
      return wrapError('TP_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_PLANS.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('TP_DELETE', (e as Error).message)
    }
  })
}
