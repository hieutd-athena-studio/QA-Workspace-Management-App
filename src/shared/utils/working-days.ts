const VN_HOLIDAYS = new Set([
  // 2025
  '2025-01-01',
  '2025-01-27', '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31',
  '2025-02-03',
  '2025-04-07',
  '2025-04-30', '2025-05-01',
  '2025-09-02',
  // 2026
  '2026-01-01',
  '2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17',
  '2026-02-18', '2026-02-19', '2026-02-20',
  '2026-04-27',
  '2026-04-30', '2026-05-01',
  '2026-09-02',
  // 2027
  '2027-01-01',
  '2027-02-05', '2027-02-06', '2027-02-07', '2027-02-08',
  '2027-02-09', '2027-02-10', '2027-02-11',
  '2027-04-16',
  '2027-04-30', '2027-05-01',
  '2027-09-02',
])

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function isWorkingDay(d: Date): boolean {
  const day = d.getDay()
  if (day === 0 || day === 6) return false
  return !VN_HOLIDAYS.has(toDateOnly(d))
}

function todayLocal(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** Working days from today (inclusive) through endDate (inclusive). Negative = overdue. */
export function calculateWorkingDaysRemaining(endDate: string): number {
  const today = todayLocal()
  const end = new Date(endDate + 'T00:00:00')
  const step = end >= today ? 1 : -1
  let count = 0
  const cur = new Date(today)
  while (step === 1 ? cur <= end : cur >= end) {
    if (isWorkingDay(cur)) count += step
    cur.setDate(cur.getDate() + step)
  }
  return count
}

/** Calendar-day % elapsed from startDate to today, capped 0–100. */
export function getProgressPercent(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00').getTime()
  const end = new Date(endDate + 'T00:00:00').getTime()
  const now = todayLocal().getTime()
  if (end <= start) return 100
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
}

export type DeadlineStatus = 'safe' | 'warning' | 'critical' | 'overdue'

export function getDeadlineStatus(endDate: string, summary?: string): DeadlineStatus {
  const today = todayLocal()
  const end = new Date(endDate + 'T00:00:00')
  if (end < today) return 'overdue'
  // All tasks done before deadline = healthy
  if (summary !== undefined && getTaskProgressPercent(summary) === 100) return 'safe'
  const remaining = calculateWorkingDaysRemaining(endDate)
  if (remaining <= 3) return 'critical'
  if (remaining <= 7) return 'warning'
  return 'safe'
}

/** Working days from startDate (inclusive) to endDate (inclusive), skipping weekends + VN holidays. */
export function calculateWorkingDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T00:00:00')
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    if (isWorkingDay(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Sum of task.days values. Tasks without days field count as 0. Returns 0 for invalid summary. */
export function getTotalTaskDays(summary: string): number {
  if (!summary) return 0
  try {
    const parsed = JSON.parse(summary)
    if (!Array.isArray(parsed)) return 0
    return parsed.reduce((sum: number, t: { days?: number }) => sum + (t.days ?? 0), 0)
  } catch {
    return 0
  }
}

export function formatDaysRemaining(endDate: string): string {
  const today = todayLocal()
  const end = new Date(endDate + 'T00:00:00')
  if (end < today) return 'Overdue'
  const days = calculateWorkingDaysRemaining(endDate)
  return days === 1 ? '1 working day' : `${days} working days`
}

/**
 * Returns task completion % (0–100) based on done/total tasks.
 * Returns null if summary has no valid tasks (caller should fall back to calendar %).
 */
export function getTaskProgressPercent(summary: string): number | null {
  if (!summary) return null
  try {
    const parsed = JSON.parse(summary)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    const done = parsed.filter((t: { done: boolean }) => t.done).length
    return Math.round((done / parsed.length) * 100)
  } catch {
    return null
  }
}
