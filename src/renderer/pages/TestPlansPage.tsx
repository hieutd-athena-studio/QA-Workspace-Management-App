import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestPlan, CreateTestPlanDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import { useProject } from '../contexts/ProjectContext'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import { getDeadlineStatus, getProgressPercent, getTaskProgressPercent, formatDaysRemaining } from '@shared/utils/working-days'
import './TestPlansPage.css'

function PlansEmptyState({ onAction }: { onAction: () => void }) {
  return (
    <div className="plans-empty">
      <svg className="plans-empty-illustration" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="30" width="90" height="110" rx="8" fill="#e8edf5"/>
        <rect x="20" y="30" width="90" height="22" rx="8" fill="#c8d4e8"/>
        <rect x="20" y="44" width="90" height="8" rx="0" fill="#c8d4e8"/>
        <rect x="32" y="37" width="40" height="6" rx="3" fill="#98afc8"/>
        <rect x="32" y="62" width="66" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="32" y="74" width="50" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="32" y="86" width="58" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="32" y="98" width="42" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="50" y="20" width="90" height="110" rx="8" fill="#eef1f8" opacity="0.6"/>
        <rect x="70" y="12" width="90" height="110" rx="8" fill="#f2f5fb" opacity="0.4"/>
      </svg>
      <p className="plans-empty-title">No test plans yet</p>
      <p className="plans-empty-desc">Create your first test plan to start organizing test cycles and tracking quality.</p>
      <button className="btn btn-primary" onClick={onAction}>+ New Test Plan</button>
    </div>
  )
}

export default function TestPlansPage() {
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const { selectedProject } = useProject()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TestPlan | null>(null)

  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [taskList, setTaskList] = useState('')

  const { data: plans, loading } = useApi<TestPlan[]>(
    () => selectedProject
      ? window.api.testPlans.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'testPlans'
  )

  if (!selectedProject) return (
    <div className="no-project-guard">
      <p className="no-project-guard-title">No project selected</p>
      <p className="no-project-guard-desc">Select a project to manage its test plans.</p>
      <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
    </div>
  )

  const resetForm = () => {
    setName(''); setVersion(''); setStartDate(''); setEndDate(''); setTaskList('')
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!name.trim() || !version.trim() || !startDate || !endDate || !selectedProject) return
    try {
      const tasks = taskList.trim()
        ? taskList.split('\n').map(line => ({ text: line.trim(), done: false })).filter(t => t.text)
        : []
      const dto: CreateTestPlanDTO = {
        project_id: selectedProject.id,
        name: name.trim(), summary: JSON.stringify(tasks),
        version: version.trim(),
        start_date: startDate, end_date: endDate
      }
      await window.api.testPlans.create(dto)
      invalidate('testPlans')
      notify('Test plan created', 'success')
      resetForm()
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await window.api.testPlans.delete(id)
      invalidate('testPlans')
      invalidate('testCycles')
      notify('Test plan deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeleteTarget(null)
  }

  return (
    <div className="plans-page">
      <div className="plans-page-header">
        <h1>Test Plans</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Test Plan</button>
      </div>

      {loading ? (
        <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>Loading…</div>
      ) : !plans?.length ? (
        <PlansEmptyState onAction={() => setShowForm(true)} />
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => {
            const status = getDeadlineStatus(plan.end_date)
            const taskProgress = getTaskProgressPercent(plan.summary)
            const progress = taskProgress !== null ? taskProgress : getProgressPercent(plan.start_date, plan.end_date)
            const daysLabel = formatDaysRemaining(plan.end_date)
            return (
              <div key={plan.id} className={`plan-card plan-card--${status}`} onClick={() => navigate(`/plans/${plan.id}`)}>
                <div className="plan-card-top">
                  <span className="plan-card-name">{plan.name}</span>
                  <span className="version-badge">{plan.version}</span>
                </div>
                {plan.display_id && (
                  <span className="plan-card-display-id">{plan.display_id}</span>
                )}
                <div className="plan-card-dates">
                  <span>{new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="plan-card-dates-sep" />
                  <span>{new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="plan-deadline-bar">
                  <div className="plan-deadline-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="plan-card-footer">
                  <span className="plan-card-meta">Click to view cycles →</span>
                  <span className={`plan-deadline-badge plan-deadline-badge--${status}`}>{daysLabel}</span>
                  <button
                    className="plan-card-delete"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(plan) }}
                    title="Delete plan"
                  >Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <div className="tcf-overlay" onClick={resetForm}>
          <div className="tcf-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tcf-title">New Test Plan</h2>
            <div className="plan-form-grid">
              <div className="form-group">
                <label className="tcf-label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., v2.0 Release" autoFocus />
              </div>
              <div className="form-group">
                <label className="tcf-label">Version</label>
                <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g., v2.0" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="tcf-label">Initial Tasks (one per line)</label>
                <textarea className="input plan-summary-input" value={taskList} onChange={(e) => setTaskList(e.target.value)} placeholder="e.g., Login flow&#10;Payment processing&#10;Error handling" rows={3} />
              </div>
              <div className="plan-form-dates">
                <div className="form-group">
                  <label className="tcf-label">Start Date</label>
                  <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="tcf-label">End Date</label>
                  <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="tcf-footer">
              <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || !version.trim() || !startDate || !endDate}>
                Create Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Test Plan"
          message={`Delete "${deleteTarget.name}"? All cycles and assignments will be removed.`}
          confirmLabel="Delete" danger
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
