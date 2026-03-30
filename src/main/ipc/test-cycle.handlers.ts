import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { TestCycleRepository } from '../database/repositories/test-cycle.repo'
import { getDatabase } from '../database/connection'

export function registerTestCycleHandlers(): void {
  const repo = new TestCycleRepository(getDatabase())

  ipcMain.handle(IPC.TEST_CYCLES.GET_BY_PLAN, (_e, planId: number) => {
    try {
      return wrapSuccess(repo.getByPlan(planId))
    } catch (e: unknown) {
      return wrapError('CYCLE_GET_BY_PLAN', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CYCLES.GET_BY_ID, (_e, id: number) => {
    try {
      const cycle = repo.getById(id)
      if (!cycle) return wrapError('CYCLE_NOT_FOUND', 'Test cycle not found')
      return wrapSuccess(cycle)
    } catch (e: unknown) {
      return wrapError('CYCLE_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CYCLES.CREATE, (_e, dto) => {
    try {
      return wrapSuccess(repo.create(dto))
    } catch (e: unknown) {
      return wrapError('CYCLE_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CYCLES.UPDATE, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.update(id, dto))
    } catch (e: unknown) {
      return wrapError('CYCLE_UPDATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.TEST_CYCLES.DELETE, (_e, id: number) => {
    try {
      repo.delete(id)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('CYCLE_DELETE', (e as Error).message)
    }
  })
}
