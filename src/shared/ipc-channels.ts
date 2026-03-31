export const IPC = {
  PROJECTS: {
    GET_ALL: 'projects:get-all',
    GET_BY_ID: 'projects:get-by-id',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete'
  },
  FOLDERS: {
    GET_ALL: 'folders:get-all',
    GET_BY_PROJECT: 'folders:get-by-project',
    GET_CHILDREN: 'folders:get-children',
    GET_BY_ID: 'folders:get-by-id',
    CREATE: 'folders:create',
    UPDATE: 'folders:update',
    MOVE: 'folders:move',
    DELETE: 'folders:delete'
  },
  TEST_CASES: {
    GET_BY_FOLDER: 'test-cases:get-by-folder',
    GET_BY_ID: 'test-cases:get-by-id',
    CREATE: 'test-cases:create',
    UPDATE: 'test-cases:update',
    DELETE: 'test-cases:delete',
    SEARCH: 'test-cases:search'
  },
  TEST_PLANS: {
    GET_ALL: 'test-plans:get-all',
    GET_BY_PROJECT: 'test-plans:get-by-project',
    GET_BY_ID: 'test-plans:get-by-id',
    CREATE: 'test-plans:create',
    UPDATE: 'test-plans:update',
    DELETE: 'test-plans:delete'
  },
  TEST_CYCLES: {
    GET_BY_PLAN: 'test-cycles:get-by-plan',
    GET_BY_ID: 'test-cycles:get-by-id',
    CREATE: 'test-cycles:create',
    UPDATE: 'test-cycles:update',
    DELETE: 'test-cycles:delete'
  },
  ASSIGNMENTS: {
    GET_BY_CYCLE: 'assignments:get-by-cycle',
    ASSIGN: 'assignments:assign',
    UNASSIGN: 'assignments:unassign',
    UPDATE_STATUS: 'assignments:update-status'
  },
  REPORTS: {
    GENERATE: 'reports:generate',
    GET_DATA: 'reports:get-data',
    GET_BY_CYCLE: 'reports:get-by-cycle'
  }
} as const
