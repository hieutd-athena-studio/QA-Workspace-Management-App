import React, { useMemo } from 'react'
import type { TestPlan, TestCycle } from '@shared/types'
import { useApi } from '../hooks/useApi'
import EmptyState from '../components/shared/EmptyState'
import './GanttPage.css'

interface PlanWithCycles extends TestPlan {
  cycles: (TestCycle & { effective_start: string; effective_end: string })[]
}

export default function GanttPage() {
  const { data: plans } = useApi<TestPlan[]>(() => window.api.testPlans.getAll(), [], 'testPlans')

  const { data: plansWithCycles } = useApi<PlanWithCycles[]>(
    async () => {
      if (!plans?.length) return []
      const result: PlanWithCycles[] = []
      for (const plan of plans) {
        const cycles = await window.api.testCycles.getByPlan(plan.id)
        // Apply COALESCE logic client-side for cycles without dates
        const cyclesWithDates = cycles.map((c: TestCycle) => ({
          ...c,
          effective_start: c.start_date || plan.start_date,
          effective_end: c.end_date || plan.end_date
        }))
        result.push({ ...plan, cycles: cyclesWithDates })
      }
      return result
    },
    [plans?.length],
    'testCycles'
  )

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (!plansWithCycles?.length) return { minDate: new Date(), maxDate: new Date(), totalDays: 1 }
    let min = Infinity, max = -Infinity
    for (const p of plansWithCycles) {
      const s = new Date(p.start_date).getTime()
      const e = new Date(p.end_date).getTime()
      if (s < min) min = s
      if (e > max) max = e
    }
    // Add padding
    min -= 86400000 * 2
    max += 86400000 * 2
    const days = Math.max(1, Math.ceil((max - min) / 86400000))
    return { minDate: new Date(min), maxDate: new Date(max), totalDays: days }
  }, [plansWithCycles])

  const getBarStyle = (start: string, end: string) => {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const minT = minDate.getTime()
    const range = totalDays * 86400000
    const left = ((s - minT) / range) * 100
    const width = Math.max(1, ((e - s) / range) * 100)
    return { left: `${left}%`, width: `${width}%` }
  }

  const dateMarkers = useMemo(() => {
    const markers: { label: string; left: string }[] = []
    const step = Math.max(1, Math.floor(totalDays / 10))
    for (let i = 0; i <= totalDays; i += step) {
      const d = new Date(minDate.getTime() + i * 86400000)
      markers.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        left: `${(i / totalDays) * 100}%`
      })
    }
    return markers
  }, [minDate, totalDays])

  if (!plansWithCycles?.length) {
    return (
      <div className="gantt-page">
        <h1 className="headline-sm" style={{ marginBottom: 'var(--sp-6)' }}>Gantt Chart</h1>
        <EmptyState
          icon="&#9866;"
          title="No test plans"
          description="Create test plans with dates to see the Gantt chart."
        />
      </div>
    )
  }

  return (
    <div className="gantt-page">
      <h1 className="headline-sm" style={{ marginBottom: 'var(--sp-6)' }}>Gantt Chart</h1>

      <div className="gantt-container card">
        <div className="gantt-timeline">
          {dateMarkers.map((m, i) => (
            <div key={i} className="gantt-date-marker" style={{ left: m.left }}>
              <span className="label-sm">{m.label}</span>
            </div>
          ))}
        </div>

        <div className="gantt-rows">
          {plansWithCycles.map((plan) => (
            <React.Fragment key={plan.id}>
              <div className="gantt-row gantt-row-plan">
                <div className="gantt-label">
                  <strong>{plan.name}</strong>
                  <span className="body-sm text-muted">{plan.version}</span>
                </div>
                <div className="gantt-bar-container">
                  <div className="gantt-bar gantt-bar-plan" style={getBarStyle(plan.start_date, plan.end_date)}
                    title={`${plan.name}: ${plan.start_date} → ${plan.end_date}`}
                  />
                </div>
              </div>

              {plan.cycles.map((cycle) => (
                <div key={cycle.id} className="gantt-row gantt-row-cycle">
                  <div className="gantt-label gantt-label-indent">
                    <span>{cycle.name}</span>
                    <span className="body-sm text-muted">{cycle.build_name}</span>
                  </div>
                  <div className="gantt-bar-container">
                    <div className="gantt-bar gantt-bar-cycle" style={getBarStyle(cycle.effective_start, cycle.effective_end)}
                      title={`${cycle.name}: ${cycle.effective_start} → ${cycle.effective_end}`}
                    />
                  </div>
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
