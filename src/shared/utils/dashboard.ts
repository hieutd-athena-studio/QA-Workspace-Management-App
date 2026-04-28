import type { TestPlan } from '@shared/types'
import { getTaskProgressPercent } from './working-days'

function isPlanHealthy(plan: TestPlan): boolean {
  const pct = getTaskProgressPercent(plan.summary)
  if (pct !== 100) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(plan.end_date + 'T00:00:00')
  return end >= today
}

/** Returns 0–100 health score: % of plans with all tasks done before deadline. */
export function calculateProjectHealth(plans: TestPlan[]): number {
  if (plans.length === 0) return 0
  const healthy = plans.filter(isPlanHealthy).length
  return Math.round((healthy / plans.length) * 100)
}
