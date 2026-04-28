import { describe, it, expect } from 'vitest'
import { calculateProjectHealth } from './dashboard'
import type { TestPlan } from '@shared/types'

function makePlan(overrides: Partial<TestPlan>): TestPlan {
  return {
    id: 1,
    display_id: 'PRJ-PL001',
    project_id: 1,
    name: 'Test Plan',
    summary: '[]',
    version: 'v1',
    start_date: '2026-01-01',
    end_date: '2099-12-31',
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
    ...overrides,
  }
}

const allDone = JSON.stringify([{ text: 'A', done: true }, { text: 'B', done: true }])
const notDone = JSON.stringify([{ text: 'A', done: false }])

describe('calculateProjectHealth', () => {
  it('returns 0 when no plans', () => {
    expect(calculateProjectHealth([])).toBe(0)
  })

  it('returns 0 when plans have no tasks', () => {
    const plans = [makePlan({ summary: '[]' }), makePlan({ summary: '' })]
    expect(calculateProjectHealth(plans)).toBe(0)
  })

  it('returns 100 when all plans are healthy (100% tasks done, not overdue)', () => {
    const plans = [
      makePlan({ summary: allDone, end_date: '2099-12-31' }),
      makePlan({ id: 2, summary: allDone, end_date: '2099-12-31' }),
    ]
    expect(calculateProjectHealth(plans)).toBe(100)
  })

  it('returns 0 when all plans are unhealthy', () => {
    const plans = [
      makePlan({ summary: notDone, end_date: '2099-12-31' }),
      makePlan({ id: 2, summary: allDone, end_date: '2020-01-01' }), // overdue
    ]
    expect(calculateProjectHealth(plans)).toBe(0)
  })

  it('returns 50 when half of plans are healthy', () => {
    const plans = [
      makePlan({ summary: allDone, end_date: '2099-12-31' }),
      makePlan({ id: 2, summary: notDone, end_date: '2099-12-31' }),
    ]
    expect(calculateProjectHealth(plans)).toBe(50)
  })
})
