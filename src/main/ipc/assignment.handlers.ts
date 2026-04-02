import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { AssignmentRepository } from '../database/repositories/assignment.repo'
import { getDatabase } from '../database/connection'

export function registerAssignmentHandlers(): void {
  const repo = new AssignmentRepository(getDatabase())

  ipcMain.handle(IPC.ASSIGNMENTS.GET_BY_CYCLE, (_e, cycleId: number) => {
    try {
      return wrapSuccess(repo.getByCycle(cycleId))
    } catch (e: unknown) {
      return wrapError('ASSIGN_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.ASSIGNMENTS.ASSIGN, (_e, cycleId: number, testCaseIds: number[]) => {
    try {
      repo.assign(cycleId, testCaseIds)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('ASSIGN_CREATE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.ASSIGNMENTS.UNASSIGN, (_e, assignmentId: number) => {
    try {
      repo.unassign(assignmentId)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('ASSIGN_DELETE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.ASSIGNMENTS.BATCH_UNASSIGN, (_e, assignmentIds: number[]) => {
    try {
      repo.batchUnassign(assignmentIds)
      return wrapSuccess(null)
    } catch (e: unknown) {
      return wrapError('ASSIGN_BATCH_DELETE', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.ASSIGNMENTS.UPDATE_STATUS, (_e, id: number, dto) => {
    try {
      return wrapSuccess(repo.updateStatus(id, dto))
    } catch (e: unknown) {
      return wrapError('ASSIGN_UPDATE', (e as Error).message)
    }
  })
}
