import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestPlan, CreateTestPlanDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import EmptyState from '../components/shared/EmptyState'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import './TestPlansPage.css'

export default function TestPlansPage() {
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TestPlan | null>(null)

  const [name, setName] = useState('')
  const [version, setVersion] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const { data: plans, loading } = useApi<TestPlan[]>(
    () => window.api.testPlans.getAll(),
    [],
    'testPlans'
  )

  const resetForm = () => {
    setName(''); setVersion(''); setStartDate(''); setEndDate('')
    setShowForm(false)
  }

  const handleCreate = async () => {
    if (!name.trim() || !version.trim() || !startDate || !endDate) return
    try {
      const dto: CreateTestPlanDTO = {
        name: name.trim(), version: version.trim(),
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
      <div className="plans-header flex items-center justify-between">
        <h1 className="headline-sm">Test Plans</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Test Plan</button>
      </div>

      {loading ? (
        <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>Loading...</div>
      ) : !plans?.length ? (
        <EmptyState
          icon="&#128203;"
          title="No test plans"
          description="Create your first test plan to start organizing test cycles."
          actionLabel="Create Test Plan"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.id} className="card plan-card cursor-pointer" onClick={() => navigate(`/plans/${plan.id}`)}>
              <div className="flex items-center justify-between">
                <h3 className="title-sm">{plan.name}</h3>
                <span className="version-badge">{plan.version}</span>
              </div>
              <div className="body-sm text-muted" style={{ marginTop: 'var(--sp-2)' }}>
                {new Date(plan.start_date).toLocaleDateString()} — {new Date(plan.end_date).toLocaleDateString()}
              </div>
              <div style={{ marginTop: 'var(--sp-3)' }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(plan) }}
                >Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>New Test Plan</h2></div>
            <div className="flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., v2.0 Release" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Version</label>
                <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g., v2.0" />
              </div>
              <div className="flex gap-4">
                <div className="form-group flex-1">
                  <label className="form-label">Start Date</label>
                  <input className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="form-group flex-1">
                  <label className="form-label">End Date</label>
                  <input className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!name.trim() || !version.trim() || !startDate || !endDate}>Create Plan</button>
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
