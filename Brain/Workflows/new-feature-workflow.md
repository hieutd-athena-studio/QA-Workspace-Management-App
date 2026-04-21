---
title: New Feature Workflow — QA-Workspace-Management-App
type: workflow
project: QA-Workspace-Management-App
---

# New Feature Workflow — QA-Workspace-Management-App

End-to-end checklist for shipping a feature that touches the Main ⇄ Renderer IPC boundary (most features do).

## 0. Read before coding

- [[QA-Workspace-Management-App-Context]] — verify the feature doesn't violate a Do / Don't rule
- `Rules/api-conventions.md` — IPC pattern and architecture

## 1. Types first — `src/shared/types/<domain>.ts`

Define the DTOs used at the boundary. Types are shared; implementations are not.

## 2. Channel constant — `src/shared/ipc-channels.ts`

Add `IPC.<DOMAIN>.<ACTION>` — no raw channel strings anywhere.

## 3. Repository — `src/main/database/repositories/<entity>.repo.ts`

- Prepared statements only; parameterized queries
- Compute display ID at insert time if applicable
- Return with display IDs already populated

## 4. Handler — `src/main/ipc/<domain>.handlers.ts`

```ts
ipcMain.handle(IPC.<DOMAIN>.<ACTION>, wrapError(async (_, dto) => {
  const repo = new <Entity>Repo(db);
  return wrapSuccess(await repo.<method>(dto));
}));
```

Register in `src/main/ipc/register-all.ts`.

## 5. Preload bridge — `src/preload/index.ts` + `src/preload/index.d.ts`

Expose via `window.api.<domain>.<action>` + TypeScript declaration.

## 6. Hook — `src/renderer/hooks/useApi.ts` or a domain-specific wrapper

```ts
const { data, loading } = useApi<T>(
  () => window.api.<domain>.fetch(id),
  [id],
  '<domain>-cache-key'
);
```

**Never** call `window.api.*` from a component directly.

## 7. Component — `src/renderer/components/<feature>/<Component>.tsx` + `.css`

- Arrow function `const X = () => {...}`
- `interface Props` at top of file
- Under 100 lines; extract hooks if longer
- One colocated `.css` file; BEM-light naming

## 8. Invalidation

After any mutation:

```ts
const { invalidate } = useInvalidation();
invalidate('<domain>');
```

## 9. Smoke test in dev

```bash
npm run dev
```

Exercise the feature in the running app. Don't claim "done" until the flow works in the UI. Check DevTools console for errors.

## 10. Write a journal entry

Follow [[session-end-workflow]]. If a new decision was made, create an ADR.

## Troubleshooting

- `window.api.<method>` is undefined → see [[error-handling]] checklist
- Hot reload not working → restart `npm run dev`, clear `.vite` cache
- Build fails → check `electron.vite.config.ts` + path aliases (`@shared`, `@renderer`)
