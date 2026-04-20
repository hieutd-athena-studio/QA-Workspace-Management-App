# Error Handling

## IPC Error Pattern

```typescript
// Main process — wrap all handlers
const wrapError =
  (fn) =>
  async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      return { error: e.message };
    }
  };

// Renderer — always check result
const result = await window.api.call();
if (result.error) notify(result.error, 'error');
```

IPC results return `{ success?: T, error?: string }` — see `src/shared/types/ipc-result.ts`.

## Troubleshooting

### IPC Method Not Found (`window.api.<method>` is undefined)

1. Exposed in `src/preload/index.ts`?
2. Types declared in `src/preload/index.d.ts`?
3. Handler registered in `src/main/ipc/<domain>.handlers.ts`?
4. Handler imported + called in `src/main/ipc/register-all.ts`?
5. Handlers registered in `src/main/index.ts` during app init?

### Hot Reload Not Working

- Restart `npm run dev`
- Check electron-vite config watch paths
- Verify no syntax errors in changed files
- Clear `.vite` cache if needed

### TypeScript Errors on window.api

- Ensure `src/preload/index.d.ts` exports proper types
- Check `tsconfig.json` includes preload types
- Use `import type` for type-only imports in preload

### Build Fails

- Check `electron.vite.config.ts` for correct entry points
- Verify all imports use correct path aliases (`@shared`, `@renderer`)
- Ensure no circular dependencies
- Run `npm install` to update deps
