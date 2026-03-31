import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, CreateTestCycleDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
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
          <button className="btn btn-secondary" onClick={() => navigate('/plans')}>Back</button>
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
              </div>
              <div className="cycle-row-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(cycle) }}
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
