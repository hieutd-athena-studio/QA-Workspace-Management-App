export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } }

export class IpcError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'IpcError'
  }
}

export function wrapSuccess<T>(data: T): IpcResult<T> {
  return { success: true, data }
}

export function wrapError<T>(code: string, message: string): IpcResult<T> {
  return { success: false, error: { code, message } }
}
