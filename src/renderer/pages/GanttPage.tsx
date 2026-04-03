import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestPlan, TestCycle } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useProject } from '../contexts/ProjectContext'
import './GanttPage.css'

interface PlanWithCycles extends TestPlan {
  cycles: (TestCycle & { effective_start: string; effective_end: string })[]
}

export default function GanttPage() {
  const navigate = useNavigate()
  const { selectedProject } = useProject()

  const { data: plans } = useApi<TestPlan[]>(
    () => selectedProject
      ? window.api.testPlans.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'testPlans'
  )

  const { data: plansWithCycles } = useApi<PlanWithCycles[]>(
    async () => {
      if (!plans?.length) return []
      const result: PlanWithCycles[] = []
      for (const plan of plans) {
        const cycles = await window.api.testCycles.getByPlan(plan.id)
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

  const { minDate, totalDays } = useMemo(() => {
    if (!plansWithCycles?.length) return { minDate: new Date(), totalDays: 1 }
    let min = Infinity, max = -Infinity
    for (const p of plansWithCycles) {
      const s = new Date(p.start_date).getTime()
      const e = new Date(p.end_date).getTime()
      if (s < min) min = s
      if (e > max) max = e
    }
    min -= 86400000 * 3
    max += 86400000 * 3
    const days = Math.max(1, Math.ceil((max - min) / 86400000))
    return { minDate: new Date(min), totalDays: days }
  }, [plansWithCycles])

  const getBarStyle = (start: string, end: string) => {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const minT = minDate.getTime()
    const range = totalDays * 86400000
    const left = ((s - minT) / range) * 100
    const width = Math.max(0.5, ((e - s) / range) * 100)
    return { left: `${left}%`, width: `${width}%` }
  }

  const dateMarkers = useMemo(() => {
    const markers: { label: string; left: string }[] = []
    const step = Math.max(1, Math.floor(totalDays / 8))
    for (let i = 0; i <= totalDays; i += step) {
      const d = new Date(minDate.getTime() + i * 86400000)
      markers.push({
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        left: `${(i / totalDays) * 100}%`
      })
    }
    return markers
  }, [minDate, totalDays])

  if (!selectedProject) return (
    <div className="no-project-guard">
      <p className="no-project-guard-title">No project selected</p>
      <p className="no-project-guard-desc">Select a project to view its Gantt chart.</p>
      <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
    </div>
  )

  return (
    <div className="gantt-page">
      <div className="gantt-page-header">
        <h1>Gantt Chart</h1>
      </div>

      {!plansWithCycles?.length ? (
        <div className="gantt-empty">
          <div className="gantt-empty-icon">📅</div>
          <p className="gantt-empty-title">No test plans</p>
          <p className="gantt-empty-desc">Create test plans with start and end dates to see them on the timeline.</p>
        </div>
      ) : (
        <div className="gantt-container">
          {/* Date axis */}
          <div className="gantt-timeline">
            {dateMarkers.map((m, i) => (
              <div key={i} className="gantt-date-marker" style={{ left: m.left }}>
                <div className="gantt-date-marker-tick" />
                <span className="gantt-date-marker-label">{m.label}</span>
              </div>
            ))}
          </div>

          <div className="gantt-rows">
            {plansWithCycles.map((plan) => (
              <React.Fragment key={plan.id}>
                <div className="gantt-row gantt-row-plan">
                  <div className="gantt-label">
                    <span className="gantt-label-name">{plan.name}</span>
                    <span className="gantt-label-sub">{plan.version}</span>
                  </div>
                  <div className="gantt-bar-container">
                    <div
                      className="gantt-bar gantt-bar-plan"
                      style={getBarStyle(plan.start_date, plan.end_date)}
                      title={`${plan.name}: ${plan.start_date} → ${plan.end_date}`}
                    />
                  </div>
                </div>

                {plan.cycles.map((cycle) => (
                  <div key={cycle.id} className="gantt-row gantt-row-cycle">
                    <div className="gantt-label gantt-label-indent">
                      <span className="gantt-label-name">{cycle.name}</span>
                      <span className="gantt-label-sub">
                        {cycle.build_name}
                        {cycle.environment && <span className="gantt-env-tag">{cycle.environment}</span>}
                      </span>
                    </div>
                    <div className="gantt-bar-container">
                      <div
                        className="gantt-bar gantt-bar-cycle"
                        style={getBarStyle(cycle.effective_start, cycle.effective_end)}
                        title={`${cycle.name}: ${cycle.effective_start} → ${cycle.effective_end}`}
                      />
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
