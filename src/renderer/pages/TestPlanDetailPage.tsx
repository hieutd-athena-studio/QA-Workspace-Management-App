import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, CreateTestCycleDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import './TestPlanDetailPage.css'

export default function TestPlanDetailPage() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [showCycleForm, setShowCycleForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TestCycle | null>(null)

  const [cycleName, setCycleName] = useState('')
  const [buildName, setBuildName] = useState('')

  const { data: plan } = useApi<TestPlan>(
    () => window.api.testPlans.getById(Number(planId)),
    [planId],
    'testPlans'
  )

  const { data: cycles } = useApi<TestCycle[]>(
    () => window.api.testCycles.getByPlan(Number(planId)),
    [planId],
    'testCycles'
  )

  const handleCreateCycle = async () => {
    if (!cycleName.trim() || !buildName.trim()) return
    try {
      const dto: CreateTestCycleDTO = {
        name: cycleName.trim(),
        build_name: buildName.trim(),
        test_plan_id: Number(planId)
      }
      await window.api.testCycles.create(dto)
      invalidate('testCycles')
      notify('Test cycle created', 'success')
      setCycleName(''); setBuildName('')
      setShowCycleForm(false)
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

  if (!plan) return <div className="text-muted">Loading...</div>

  return (
    <div className="plan-detail-page">
      <div className="breadcrumb body-sm text-muted">
        <Link to="/plans">Test Plans</Link> <span>/</span> <span>{plan.name}</span>
      </div>

      <div className="plan-detail-header flex items-center justify-between">
        <div>
          <h1 className="headline-sm">{plan.name} <span className="version-badge">{plan.version}</span></h1>
          <p className="body-sm text-muted" style={{ marginTop: 'var(--sp-1)' }}>
            {new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={() => setShowCycleForm(true)}>+ New Cycle</button>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/plans')}>Back</button>
        </div>
      </div>

      <h2 className="title-sm" style={{ marginTop: 'var(--sp-6)', marginBottom: 'var(--sp-4)' }}>
        Test Cycles ({cycles?.length || 0})
      </h2>

      {!cycles?.length ? (
        <EmptyState
          icon="&#128260;"
          title="No test cycles"
          description="Add a test cycle for each build you want to test."
          actionLabel="Create Cycle"
          onAction={() => setShowCycleForm(true)}
        />
      ) : (
        <div className="cycles-list">
          {cycles.map((cycle) => (
            <div
              key={cycle.id}
              className="card cycle-row flex items-center justify-between cursor-pointer"
              onClick={() => navigate(`/plans/${planId}/cycles/${cycle.id}`)}
            >
              <div>
                <span className="title-sm">{cycle.name}</span>
                <span className="body-sm text-muted" style={{ marginLeft: 'var(--sp-3)' }}>{cycle.build_name}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(cycle) }}
                >&times;</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCycleForm && (
        <div className="modal-overlay" onClick={() => setShowCycleForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>New Test Cycle</h2></div>
            <div className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Cycle Name</label>
                <input className="input" value={cycleName} onChange={(e) => setCycleName(e.target.value)} placeholder="e.g., Cycle 1" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Build Name</label>
                <input className="input" value={buildName} onChange={(e) => setBuildName(e.target.value)} placeholder="e.g., Build 1.0.1" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCycleForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreateCycle} disabled={!cycleName.trim() || !buildName.trim()}>Create Cycle</button>
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
    </div>
  )
}
