import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, TestPlan } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useProject } from '../contexts/ProjectContext'
import { calculateProjectHealth } from '@shared/utils/dashboard'
import { getDeadlineStatus } from '@shared/utils/working-days'
import './DashboardPage.css'

function healthColor(score: number): string {
  if (score >= 80) return 'health--green'
  if (score >= 40) return 'health--amber'
  return 'health--red'
}

function healthLabel(score: number, total: number): string {
  if (total === 0) return 'No plans'
  if (score === 100) return 'All healthy'
  if (score === 0) return 'At risk'
  return `${score}% healthy`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { setSelectedProject } = useProject()

  const { data: projects, loading: loadingProjects } = useApi<Project[]>(
    () => window.api.projects.getAll(),
    [],
    'projects'
  )

  const { data: allPlans, loading: loadingPlans } = useApi<TestPlan[]>(
    () => window.api.testPlans.getAll(),
    [],
    'testPlans'
  )

  const projectsWithHealth = useMemo(() => {
    if (!projects || !allPlans) return []
    return projects
      .map((project) => {
        const plans = allPlans.filter((p) => p.project_id === project.id)
        const health = calculateProjectHealth(plans)
        return { project, plans, health }
      })
      .sort((a, b) => a.health - b.health)
  }, [projects, allPlans])

  const loading = loadingProjects || loadingPlans

  const openProject = (project: Project) => {
    setSelectedProject(project)
    navigate('/plans')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="dashboard-subtitle">Health overview across all projects</p>
      </div>

      {loading ? (
        <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>Loading…</div>
      ) : projectsWithHealth.length === 0 ? (
        <div className="dashboard-empty">
          <p className="dashboard-empty-title">No projects yet</p>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>Create a project</button>
        </div>
      ) : (
        <div className="dashboard-grid">
          {projectsWithHealth.map(({ project, plans, health }) => (
            <div key={project.id} className="dashboard-card" onClick={() => openProject(project)}>
              <div className="dashboard-card-top">
                <div className="dashboard-card-name-row">
                  <span className="dashboard-project-code">{project.code}</span>
                  <span className="dashboard-project-name">{project.name}</span>
                </div>
                <div className={`health-badge ${healthColor(health)}`}>
                  {healthLabel(health, plans.length)}
                </div>
              </div>

              <div className="dashboard-health-bar-wrap">
                <div className="dashboard-health-bar">
                  <div
                    className={`dashboard-health-bar-fill ${healthColor(health)}`}
                    style={{ width: `${health}%` }}
                  />
                </div>
                <span className="dashboard-health-pct">{plans.length > 0 ? `${health}%` : '—'}</span>
              </div>

              {plans.length === 0 ? (
                <p className="dashboard-no-plans">No test plans</p>
              ) : (
                <div className="dashboard-plan-list">
                  {plans.slice(0, 4).map((plan) => {
                    const status = getDeadlineStatus(plan.end_date, plan.summary)
                    return (
                      <div key={plan.id} className={`dashboard-plan-row dashboard-plan-row--${status}`}>
                        <span className="dashboard-plan-dot" />
                        <span className="dashboard-plan-name">{plan.name}</span>
                        <span className="dashboard-plan-version">{plan.version}</span>
                      </div>
                    )
                  })}
                  {plans.length > 4 && (
                    <p className="dashboard-more">+{plans.length - 4} more</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
