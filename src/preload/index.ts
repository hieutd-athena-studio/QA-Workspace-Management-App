import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { IpcResult } from '@shared/types/ipc-result'
import { IpcError } from '@shared/types/ipc-result'

function unwrap<T>(result: IpcResult<T>): T {
  if (result.success) return result.data
  throw new IpcError(result.error.code, result.error.message)
}

const api = {
  folders: {
    getAll: async () => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.GET_ALL)),
    getChildren: async (parentId: number | null) => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.GET_CHILDREN, parentId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.CREATE, dto)),
    rename: async (id: number, newName: string) => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.UPDATE, id, newName)),
    move: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.MOVE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.FOLDERS.DELETE, id))
  },
  testCases: {
    getByFolder: async (folderId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_FOLDER, folderId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.DELETE, id)),
    search: async (query: string) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.SEARCH, query))
  },
  testPlans: {
    getAll: async () => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_ALL)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.DELETE, id))
  },
  testCycles: {
    getByPlan: async (planId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.GET_BY_PLAN, planId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CYCLES.DELETE, id))
  },
  assignments: {
    getByCycle: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.GET_BY_CYCLE, cycleId)),
    assign: async (cycleId: number, testCaseIds: number[]) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.ASSIGN, cycleId, testCaseIds)),
    unassign: async (assignmentId: number) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.UNASSIGN, assignmentId)),
    updateStatus: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.UPDATE_STATUS, id, dto))
  },
  reports: {
    getData: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_DATA, cycleId)),
    getByCycle: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_BY_CYCLE, cycleId)),
    generate: async (cycleId: number, format: 'pdf' | 'html') => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GENERATE, cycleId, format))
  }
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
