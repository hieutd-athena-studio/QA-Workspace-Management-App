# API & State Conventions

## IPC Communication Pattern

### Handler Layer (Main Process)

One handler file per domain: `src/main/ipc/<domain>.handlers.ts`

```typescript
export const register<Domain>Handlers = (ipcMain: IpcMain, db: Database) => {
  ipcMain.handle('api:<domain>:create', wrapError(async (_, dto) => {
    const repo = new <Domain>Repo(db);
    return wrapSuccess(await repo.create(dto));
  }));
};
```

Register all in `src/main/ipc/register-all.ts`, called from `src/main/index.ts`.

### Preload Bridge

```typescript
// src/preload/index.ts
export const api = {
  <domain>: {
    create: (dto) => ipcRenderer.invoke('api:<domain>:create', dto),
  },
};
```

### React Hook (Client Layer)

```typescript
// src/renderer/hooks/useApi.ts
const { data, loading } = useApi<T>(
  () => window.api.<domain>.fetch(id),
  [id],
  'domain-cache-key'
);
```

**Rule:** No IPC calls directly in components. Always wrap in hooks.

### IPC Channels (src/shared/ipc-channels.ts)

```typescript
export const IPC = {
  CATEGORIES: {
    GET_BY_PROJECT: 'api:category:getByProject',
    CREATE: 'api:category:create',
    RENAME: 'api:category:rename',
    DELETE: 'api:category:delete',
  },
  SUBCATEGORIES: {
    GET_BY_CATEGORY: 'api:subcategory:getByCategory',
    CREATE: 'api:subcategory:create',
    RENAME: 'api:subcategory:rename',
    DELETE: 'api:subcategory:delete',
  },
};
```

Test cases: `window.api.testCases.getBySubcategory(subcategoryId)`

## State Management

### Contexts

- **ProjectContext:** Selected project (persists to localStorage)
- **NotificationContext:** Toast/notifications
- **InvalidationContext:** Cache invalidation domains
- **CategoryPanel:** Category and sub-category selection state

**Use Context for:**
- ✅ Selected items (project, subcategory, cycle)
- ✅ App-level settings (theme, layout state)
- ✅ Cache invalidation signals
- ❌ High-frequency updates (scroll, mouse pos)
- ❌ Deeply nested prop drilling (use composition)

### Invalidation Pattern

```typescript
const { invalidate } = useInvalidation();
invalidate("testCases"); // After create/update/delete
```
