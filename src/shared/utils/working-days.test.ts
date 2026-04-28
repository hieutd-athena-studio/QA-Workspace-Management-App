import { describe, it, expect } from 'vitest'
import { getTaskProgressPercent } from './working-days'

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
