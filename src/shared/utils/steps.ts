import type { TestStep } from '../types/test-case'

export function parseSteps(raw: string | null): TestStep[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map((s: Record<string, unknown>, i: number) => ({
      step: typeof s.step === 'number' ? s.step : i + 1,
      action: typeof s.action === 'string' ? s.action : '',
      expected: typeof s.expected === 'string' ? s.expected : ''
    }))
  } catch {
    return []
  }
}

export function serializeSteps(steps: TestStep[]): string {
  return JSON.stringify(steps)
}
