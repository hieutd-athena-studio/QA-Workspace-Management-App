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

## Why this rule exists

Electron exposes three execution contexts:

- **Main process** — Node.js access, database, filesystem, app lifecycle
- **Renderer process** — Chromium, React UI, no direct Node.js access
- **Preload** — bridge that can selectively expose Main APIs to Renderer

A naive Electron app gives the Renderer direct Node integration for convenience. That opens the door to XSS → RCE and makes the attack surface huge. It also couples the UI to Node APIs, which complicates testing.

The contextBridge + typed `window.api` pattern above is the mitigation:

- Renderer cannot touch the filesystem or DB directly → clear security boundary.
- Typed `window.api` gives IDE autocomplete and catches missing handlers at build time.
- Easy to mock IPC in component tests (replace `window.api` with a stub).

**Tradeoff:** Every new IPC method touches 4 files (channel constant, handler, preload bridge, preload types). That friction is intentional — the consistency is worth more than saving a file or two.
