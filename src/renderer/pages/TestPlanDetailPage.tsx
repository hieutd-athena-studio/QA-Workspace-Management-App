import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, CreateTestCycleDTO, UpdateTestCycleDTO, UpdateTestPlanDTO } from '@shared/types'
import { TestCycleEnvironment } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import TaskEditorModal from '../components/shared/TaskEditorModal'
import './TestPlanDetailPage.css'

const getEnvironmentClass = (env: string | null) => {
  if (!env) return ''
  if (env === TestCycleEnvironment.DEV_CHEAT) return 'env-dev-cheat'
  if (env === TestCycleEnvironment.PROD_CHEAT) return 'env-prod-cheat'
  if (env === TestCycleEnvironment.PROD_NON_CHEAT) return 'env-prod-non-cheat'
  return ''
}

export default function TestPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [showCycleForm, setShowCycleForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TestCycle | null>(null)
  const [editingCycle, setEditingCycle] = useState<TestCycle | null>(null)
  const [editingTasks, setEditingTasks] = useState(false)
  const [tasksDraft, setTasksDraft] = useState<{ text: string; done: boolean }[]>([])
  const [editingPlan, setEditingPlan] = useState(false)
  const [planNameDraft, setPlanNameDraft] = useState('')
  const [planVersionDraft, setPlanVersionDraft] = useState('')
  const [planStartDraft, setPlanStartDraft] = useState('')
  const [planEndDraft, setPlanEndDraft] = useState('')

  const [cycleName, setCycleName] = useState('')
  const [buildName, setBuildName] = useState('')
  const [environment, setEnvironment] = useState<string | null>(null)

  const { data: plan } = useApi<TestPlan>(
    () => window.api.testPlans.getById(Number(planId)),
    [planId], 'testPlans'
  )

  const { data: cycles } = useApi<TestCycle[]>(
    () => window.api.testCycles.getByPlan(Number(planId)),
    [planId], 'testCycles'
  )

  const handleCreateCycle = async () => {
    if (!cycleName.trim() || !buildName.trim()) return
    try {
      const dto: CreateTestCycleDTO = {
        name: cycleName.trim(),
        build_name: buildName.trim(),
        test_plan_id: Number(planId),
        environment: environment || null
      }
      await window.api.testCycles.create(dto)
      invalidate('testCycles')
      notify('Test cycle created', 'success')
      setCycleName(''); setBuildName(''); setEnvironment(null)
      setShowCycleForm(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const openEditCycle = (cycle: TestCycle) => {
    setEditingCycle(cycle)
    setCycleName(cycle.name)
    setBuildName(cycle.build_name)
    setEnvironment(cycle.environment)
  }

  const handleEditCycle = async () => {
    if (!editingCycle || !cycleName.trim() || !buildName.trim()) return
    try {
      const dto: UpdateTestCycleDTO = {
        name: cycleName.trim(),
        build_name: buildName.trim(),
        environment: environment || null
      }
      await window.api.testCycles.update(editingCycle.id, dto)
      invalidate('testCycles')
      notify('Test cycle updated', 'success')
      setCycleName(''); setBuildName(''); setEnvironment(null)
      setEditingCycle(null)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const cancelEdit = () => {
    setEditingCycle(null)
    setCycleName('')
    setBuildName('')
    setEnvironment(null)
  }

  const parseTasks = (raw: string | undefined): { text: string; done: boolean }[] => {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    } catch { /* legacy plain text — ignore */ }
    return []
  }

  useEffect(() => {
    if (plan) setTasksDraft(parseTasks(plan.summary))
  }, [plan?.id, plan?.summary])

  const handleSaveTasks = async () => {
    try {
      await window.api.testPlans.update(Number(planId), { summary: JSON.stringify(tasksDraft) })
      invalidate('testPlans')
      notify('Tasks saved', 'success')
      setEditingTasks(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const openEditPlan = () => {
    if (!plan) return
    setPlanNameDraft(plan.name)
    setPlanVersionDraft(plan.version)
    setPlanStartDraft(plan.start_date)
    setPlanEndDraft(plan.end_date)
    setEditingPlan(true)
  }

  const handleSavePlan = async () => {
    if (!planNameDraft.trim() || !planVersionDraft.trim() || !planStartDraft || !planEndDraft) return
    try {
      const dto: UpdateTestPlanDTO = {
        name: planNameDraft.trim(),
        version: planVersionDraft.trim(),
        start_date: planStartDraft,
        end_date: planEndDraft,
      }
      await window.api.testPlans.update(Number(planId), dto)
      invalidate('testPlans')
      notify('Plan updated', 'success')
      setEditingPlan(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleToggleTask = async (index: number) => {
    const updated = parseTasks(plan!.summary).map((t, i) => i === index ? { ...t, done: !t.done } : t)
    try {
      await window.api.testPlans.update(Number(planId), { summary: JSON.stringify(updated) })
      invalidate('testPlans')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleDeleteCycle = async (id: number) => {
    try {
      await window.api.testCycles.delete(id)
      invalidate('testCycles')
      invalidate('assignments')
      notify('Test cycle deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeleteTarget(null)
  }

  if (!plan) return <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)' }}>Loading…</div>

  return (
    <div className="plan-detail-page">
      <div className="breadcrumb">
        <Link to="/plans">Test Plans</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{plan.name}</span>
      </div>

      {/* Hero */}
      <div className="plan-detail-hero">
        <div className="plan-detail-hero-info">
          <div className="plan-detail-hero-title">
            <h1>{plan.name}</h1>
            <span className="version-badge">{plan.version}</span>
          </div>
          <div className="plan-detail-hero-dates">
            <div className="plan-detail-hero-date">
              <span className="plan-detail-hero-date-label">Start</span>
              <span className="plan-detail-hero-date-value">
                {new Date(plan.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div style={{ width: 24, height: 1, background: 'rgba(152,177,242,0.3)' }} />
            <div className="plan-detail-hero-date">
              <span className="plan-detail-hero-date-label">End</span>
              <span className="plan-detail-hero-date-value">
                {new Date(plan.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
        <div className="plan-detail-hero-actions">
          <button className="btn btn-primary" onClick={() => setShowCycleForm(true)}>+ New Cycle</button>
          <button className="btn btn-secondary" onClick={openEditPlan}>Edit Plan</button>
          <button className="btn btn-secondary" onClick={() => navigate('/plans')}>Back</button>
        </div>
      </div>

      {/* Task list section */}
      <div className="plan-summary-section">
        <div className="plan-summary-header">
          <span className="section-title">Tasks</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingTasks(true)}>Edit</button>
        </div>
        <div className="task-list-view">
          {parseTasks(plan.summary).length === 0
            ? <span className="text-muted">No tasks yet. Click Edit to add tasks.</span>
            : parseTasks(plan.summary).map((task, i) => (
              <label key={i} className={`task-item${task.done ? ' task-item--done' : ''}`}>
                <input type="checkbox" checked={task.done} onChange={() => handleToggleTask(i)} />
                <span>{task.text}</span>
              </label>
            ))
          }
        </div>
      </div>

      {/* Cycles section */}
      <div className="section-header">
        <span className="section-title">
          Test Cycles
          <span className="section-count">{cycles?.length || 0}</span>
        </span>
        {(cycles?.length || 0) > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowCycleForm(true)}>+ Add Cycle</button>
        )}
      </div>

      {!cycles?.length ? (
        <div className="cycles-empty">
          <div className="cycles-empty-icon">🔄</div>
          <p className="cycles-empty-title">No test cycles yet</p>
          <p className="cycles-empty-desc">Add a cycle for each build you want to test against this plan.</p>
          <button className="btn btn-primary" onClick={() => setShowCycleForm(true)}>+ New Cycle</button>
        </div>
      ) : (
        <div className="cycles-list">
          {cycles.map((cycle, i) => (
            <div
              key={cycle.id}
              className="cycle-row"
              onClick={() => navigate(`/plans/${planId}/cycles/${cycle.id}`)}
            >
              <div className="cycle-row-info">
                <span className="cycle-row-index">{i + 1}</span>
                <span className="cycle-row-name">{cycle.name}</span>
                <span className="cycle-build-badge">{cycle.build_name}</span>
                {cycle.environment && <span className={`cycle-env-badge ${getEnvironmentClass(cycle.environment)}`}>{cycle.environment}</span>}
              </div>
              <div className="cycle-row-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); openEditCycle(cycle) }}
                  title="Edit cycle"
                >✎</button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(cycle) }}
                  title="Delete cycle"
                >×</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New cycle modal */}
      {showCycleForm && (
        <div className="tcf-overlay" onClick={() => setShowCycleForm(false)}>
          <div className="tcf-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tcf-title">New Test Cycle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="tcf-label">Cycle Name</label>
                <input className="input" value={cycleName} onChange={(e) => setCycleName(e.target.value)} placeholder="e.g., Cycle 1" autoFocus />
              </div>
              <div className="form-group">
                <label className="tcf-label">Build Name</label>
                <input className="input" value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="e.g., Build 1.0.1" />
              </div>
              <div className="form-group">
                <label className="tcf-label">Environment</label>
                <select className="input" value={environment || ''} onChange={(e) => setEnvironment(e.target.value || null)}>
                  <option value="">-- Select Environment --</option>
                  <option value={TestCycleEnvironment.DEV_CHEAT}>{TestCycleEnvironment.DEV_CHEAT}</option>
                  <option value={TestCycleEnvironment.PROD_CHEAT}>{TestCycleEnvironment.PROD_CHEAT}</option>
                  <option value={TestCycleEnvironment.PROD_NON_CHEAT}>{TestCycleEnvironment.PROD_NON_CHEAT}</option>
                </select>
              </div>
            </div>
            <div className="tcf-footer">
              <button className="btn btn-secondary" onClick={() => setShowCycleForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateCycle} disabled={!cycleName.trim() || !buildName.trim()}>
                Create Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit cycle modal */}
      {editingCycle && (
        <div className="tcf-overlay" onClick={cancelEdit}>
          <div className="tcf-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tcf-title">Edit Test Cycle</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="tcf-label">Cycle Name</label>
                <input className="input" value={cycleName} onChange={(e) => setCycleName(e.target.value)} placeholder="e.g., Cycle 1" autoFocus />
              </div>
              <div className="form-group">
                <label className="tcf-label">Build Name</label>
                <input className="input" value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="e.g., Build 1.0.1" />
              </div>
              <div className="form-group">
                <label className="tcf-label">Environment</label>
                <select className="input" value={environment || ''} onChange={(e) => setEnvironment(e.target.value || null)}>
                  <option value="">-- Select Environment --</option>
                  <option value={TestCycleEnvironment.DEV_CHEAT}>{TestCycleEnvironment.DEV_CHEAT}</option>
                  <option value={TestCycleEnvironment.PROD_CHEAT}>{TestCycleEnvironment.PROD_CHEAT}</option>
                  <option value={TestCycleEnvironment.PROD_NON_CHEAT}>{TestCycleEnvironment.PROD_NON_CHEAT}</option>
                </select>
              </div>
            </div>
            <div className="tcf-footer">
              <button className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
              <button className="btn btn-primary" onClick={handleEditCycle} disabled={!cycleName.trim() || !buildName.trim()}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Cycle"
          message={`Delete "${deleteTarget.name}"? All assignments will be removed.`}
          confirmLabel="Delete" danger
          onConfirm={() => handleDeleteCycle(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {editingPlan && (
        <div className="tcf-overlay" onClick={() => setEditingPlan(false)}>
          <div className="tcf-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="tcf-title">Edit Test Plan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
              <div className="form-group">
                <label className="tcf-label">Name</label>
                <input className="input" value={planNameDraft} onChange={(e) => setPlanNameDraft(e.target.value)} autoFocus />
              </div>
              <div className="form-group">
                <label className="tcf-label">Version</label>
                <input className="input" value={planVersionDraft} onChange={(e) => setPlanVersionDraft(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="tcf-label">Start Date</label>
                  <input className="input" type="date" value={planStartDraft} onChange={(e) => setPlanStartDraft(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="tcf-label">End Date</label>
                  <input className="input" type="date" value={planEndDraft} onChange={(e) => setPlanEndDraft(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="tcf-footer">
              <button className="btn btn-secondary" onClick={() => setEditingPlan(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleSavePlan}
                disabled={!planNameDraft.trim() || !planVersionDraft.trim() || !planStartDraft || !planEndDraft}
              >Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {editingTasks && (
        <TaskEditorModal
          tasks={parseTasks(plan.summary)}
          plan={plan}
          onSave={handleSaveTasks}
          onCancel={() => setEditingTasks(false)}
        />
      )}
    </div>
  )
}
