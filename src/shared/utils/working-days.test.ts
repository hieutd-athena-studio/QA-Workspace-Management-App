import { describe, it, expect } from 'vitest'
import {
  getTaskProgressPercent,
  getDeadlineStatus,
  calculateWorkingDaysBetween,
  getTotalTaskDays,
} from './working-days'

describe('getTaskProgressPercent', () => {
  it('returns null for empty string summary', () => {
    expect(getTaskProgressPercent('')).toBeNull()
  })

  it('returns null for invalid JSON summary', () => {
    expect(getTaskProgressPercent('plain text')).toBeNull()
  })

  it('returns null for empty task array', () => {
    expect(getTaskProgressPercent('[]')).toBeNull()
  })

  it('returns 0 when no tasks are done', () => {
    const tasks = JSON.stringify([
      { text: 'Login flow', done: false },
      { text: 'Payment', done: false },
    ])
    expect(getTaskProgressPercent(tasks)).toBe(0)
  })

  it('returns 50 when half of tasks are done', () => {
    const tasks = JSON.stringify([
      { text: 'Login flow', done: true },
      { text: 'Payment', done: false },
    ])
    expect(getTaskProgressPercent(tasks)).toBe(50)
  })

  it('returns 100 when all tasks are done', () => {
    const tasks = JSON.stringify([
      { text: 'Login flow', done: true },
      { text: 'Payment', done: true },
    ])
    expect(getTaskProgressPercent(tasks)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    const tasks = JSON.stringify([
      { text: 'A', done: true },
      { text: 'B', done: false },
      { text: 'C', done: false },
    ])
    expect(getTaskProgressPercent(tasks)).toBe(33)
  })
})

describe('getDeadlineStatus with summary (Task 1)', () => {
  const allDone = JSON.stringify([{ text: 'A', done: true }, { text: 'B', done: true }])
  const notDone = JSON.stringify([{ text: 'A', done: false }])

  it('returns safe when all tasks done and deadline not yet passed', () => {
    expect(getDeadlineStatus('2099-12-31', allDone)).toBe('safe')
  })

  it('returns overdue when all tasks done but deadline already passed', () => {
    expect(getDeadlineStatus('2020-01-01', allDone)).toBe('overdue')
  })

  it('uses normal calculation when tasks not all done', () => {
    // Far future, not done → safe from days-remaining logic
    expect(getDeadlineStatus('2099-12-31', notDone)).toBe('safe')
  })

  it('returns safe without summary (original behavior)', () => {
    expect(getDeadlineStatus('2099-12-31')).toBe('safe')
  })
})

describe('calculateWorkingDaysBetween (Task 2)', () => {
  it('counts two consecutive weekdays', () => {
    // Mon 2026-05-04 → Tue 2026-05-05 = 2 working days (no holidays)
    expect(calculateWorkingDaysBetween('2026-05-04', '2026-05-05')).toBe(2)
  })

  it('skips weekends', () => {
    // Sat 2026-05-02 → Mon 2026-05-04 = 1 working day (only Mon counts)
    expect(calculateWorkingDaysBetween('2026-05-02', '2026-05-04')).toBe(1)
  })

  it('returns 0 for same-day weekend', () => {
    // Sat 2026-04-25 = 0 working days
    expect(calculateWorkingDaysBetween('2026-04-25', '2026-04-25')).toBe(0)
  })

  it('returns 1 for same-day weekday', () => {
    // Mon 2026-05-04 only = 1 working day
    expect(calculateWorkingDaysBetween('2026-05-04', '2026-05-04')).toBe(1)
  })

  it('skips Vietnamese holidays', () => {
    // Apr 28 (Tue) + Apr 29 (Wed) = working; Apr 30 (holiday) + May 1 (holiday) + May 2-3 (weekend) skipped
    // May 4 (Mon) = working → total 3 working days
    expect(calculateWorkingDaysBetween('2026-04-28', '2026-05-04')).toBe(3)
  })
})

describe('getTotalTaskDays (Task 2)', () => {
  it('sums days from all tasks', () => {
    const tasks = JSON.stringify([
      { text: 'A', done: false, days: 3 },
      { text: 'B', done: false, days: 2 },
    ])
    expect(getTotalTaskDays(tasks)).toBe(5)
  })

  it('treats missing days field as 0', () => {
    const tasks = JSON.stringify([
      { text: 'A', done: false, days: 2 },
      { text: 'B', done: false },
    ])
    expect(getTotalTaskDays(tasks)).toBe(2)
  })

  it('returns 0 for empty array', () => {
    expect(getTotalTaskDays('[]')).toBe(0)
  })

  it('returns 0 for invalid summary', () => {
    expect(getTotalTaskDays('')).toBe(0)
    expect(getTotalTaskDays('plain text')).toBe(0)
  })
})
