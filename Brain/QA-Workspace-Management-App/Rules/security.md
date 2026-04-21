# Security & Validation

## Validation Rules

- **Validate at system boundaries only:** User input, IPC input from renderer
- **Trust internal code:** DB constraints, framework guarantees — no defensive double-checks
- **No impossible state guards:** If it can't happen internally, don't code for it

## IPC Security

- Preload bridge uses `contextBridge` — no direct Node.js access from renderer
- All IPC channels are named constants in `src/shared/ipc-channels.ts` — no raw strings in handlers
- Parameterized queries only in repositories — no SQL string concatenation

## Common Vulnerabilities to Avoid

- No `eval()` or dynamic code execution in renderer
- No direct filesystem access from renderer (use IPC)
- No secrets or credentials in renderer bundle
