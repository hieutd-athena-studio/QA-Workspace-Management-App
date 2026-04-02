export const IPC = {
  PROJECTS: {
    GET_ALL: 'projects:get-all',
    GET_BY_ID: 'projects:get-by-id',
    CREATE: 'projects:create',
    UPDATE: 'projects:update',
    DELETE: 'projects:delete'
  },
  CATEGORIES: {
    GET_BY_PROJECT: 'categories:get-by-project',
    GET_BY_ID: 'categories:get-by-id',
    CREATE: 'categories:create',
    RENAME: 'categories:rename',
    DELETE: 'categories:delete'
  },
  SUBCATEGORIES: {
    GET_BY_PROJECT: 'subcategories:get-by-project',
    GET_BY_CATEGORY: 'subcategories:get-by-category',
    GET_BY_ID: 'subcategories:get-by-id',
    CREATE: 'subcategories:create',
    RENAME: 'subcategories:rename',
    DELETE: 'subcategories:delete'
  },
  TEST_CASES: {
    GET_BY_SUBCATEGORY: 'test-cases:get-by-subcategory',
    GET_BY_PROJECT: 'test-cases:get-by-project',
    GET_BY_ID: 'test-cases:get-by-id',
    CREATE: 'test-cases:create',
    UPDATE: 'test-cases:update',
    DELETE: 'test-cases:delete',
    SEARCH: 'test-cases:search',
    IMPORT_CSV: 'test-cases:import-csv',
    EXPORT_CSV: 'test-cases:export-csv'
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
    BATCH_UNASSIGN: 'assignments:batch-unassign',
    UPDATE_STATUS: 'assignments:update-status'
  },
  REPORTS: {
    GENERATE: 'reports:generate',
    GET_DATA: 'reports:get-data',
    GET_MULTI_CYCLE_DATA: 'reports:get-multi-cycle-data',
    GET_BY_CYCLE: 'reports:get-by-cycle'
  }
} as const
