import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/ipc-channels'
import type { IpcResult } from '@shared/types/ipc-result'
import { IpcError } from '@shared/types/ipc-result'

function unwrap<T>(result: IpcResult<T>): T {
  if (result.success) return result.data
  throw new IpcError(result.error.code, result.error.message)
}

const api = {
  projects: {
    getAll: async () => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.GET_ALL)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.PROJECTS.DELETE, id))
  },
  categories: {
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.GET_BY_PROJECT, projectId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.CREATE, dto)),
    rename: async (id: number, name: string) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.RENAME, id, name)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.CATEGORIES.DELETE, id))
  },
  subcategories: {
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.GET_BY_PROJECT, projectId)),
    getByCategory: async (categoryId: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.GET_BY_CATEGORY, categoryId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.CREATE, dto)),
    rename: async (id: number, name: string) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.RENAME, id, name)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.SUBCATEGORIES.DELETE, id))
  },
  testCases: {
    getBySubcategory: async (subcategoryId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_SUBCATEGORY, subcategoryId)),
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_PROJECT, projectId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.DELETE, id)),
    search: async (query: string, projectId?: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.SEARCH, query, projectId)),
    importCSV: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.IMPORT_CSV, projectId)),
    exportCSV: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_CASES.EXPORT_CSV, projectId))
  },
  testPlans: {
    getAll: async () => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_ALL)),
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_PLANS.GET_BY_PROJECT, projectId)),
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
    batchUnassign: async (assignmentIds: number[]) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.BATCH_UNASSIGN, assignmentIds)),
    updateStatus: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.ASSIGNMENTS.UPDATE_STATUS, id, dto))
  },
  reports: {
    getData: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_DATA, cycleId)),
    getMultiCycleData: async (cycleIds: number[]) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_MULTI_CYCLE_DATA, cycleIds)),
    getByCycle: async (cycleId: number) => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GET_BY_CYCLE, cycleId)),
    generate: async (cycleId: number, format: 'pdf' | 'html') => unwrap(await ipcRenderer.invoke(IPC.REPORTS.GENERATE, cycleId, format))
  },
  testTypes: {
    getByProject: async (projectId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.GET_BY_PROJECT, projectId)),
    getById: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.GET_BY_ID, id)),
    create: async (dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.CREATE, dto)),
    update: async (id: number, dto: unknown) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.UPDATE, id, dto)),
    delete: async (id: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.DELETE, id)),
    addTestCase: async (testTypeId: number, testCaseId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.ADD_TEST_CASE, testTypeId, testCaseId)),
    removeTestCase: async (testTypeId: number, testCaseId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.REMOVE_TEST_CASE, testTypeId, testCaseId)),
    getTestCaseIds: async (testTypeId: number) => unwrap(await ipcRenderer.invoke(IPC.TEST_TYPES.GET_TEST_CASE_IDS, testTypeId))
  }
}

export type ElectronAPI = typeof api

contextBridge.exposeInMainWorld('api', api)
