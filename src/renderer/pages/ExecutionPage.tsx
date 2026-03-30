import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, TestCaseAssignment, ExecutionStatus } from '@shared/types'
import { parseSteps } from '@shared/utils/steps'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import './ExecutionPage.css'

export default function ExecutionPage() {
  const { planId, cycleId } = useParams<{ planId: string; cycleId: string }>()
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [bugRef, setBugRef] = useState('')

  const { data: plan } = useApi<TestPlan>(() => window.api.testPlans.getById(Number(planId)), [planId])
  const { data: cycle } = useApi<TestCycle>(() => window.api.testCycles.getById(Number(cycleId)), [cycleId])
  const { data: assignments, refetch } = useApi<TestCaseAssignment[]>(
    () => window.api.assignments.getByCycle(Number(cycleId)), [cycleId], 'assignments'
  )

  const current = assignments?.[currentIndex]
  const steps = current?.test_case_steps ? parseSteps(current.test_case_steps) : []

  useEffect(() => {
    if (current) {
      setBugRef(current.bug_ref || '')
    }
  }, [current?.id])

  const handleStatus = useCallback(async (status: ExecutionStatus) => {
    if (!current) return
    try {
      const ref = (status === 'Fail' || status === 'Blocked') ? bugRef.trim() || null : null
      await window.api.assignments.updateStatus(current.id, { status, bug_ref: ref })
      invalidate('assignments')
      refetch()
      notify(`Marked as ${status}`, 'success')
      if (currentIndex < (assignments?.length || 0) - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }, [current, bugRef, currentIndex, assignments?.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'p' || e.key === 'P') handleStatus('Pass')
      else if (e.key === 'f' || e.key === 'F') handleStatus('Fail')
      else if (e.key === 'b' || e.key === 'B') handleStatus('Blocked')
      else if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1)
      else if (e.key === 'ArrowRight' && currentIndex < (assignments?.length || 0) - 1) setCurrentIndex(currentIndex + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleStatus, currentIndex, assignments?.length])

  if (!plan || !cycle || !assignments) return <div className="text-muted">Loading...</div>

  if (assignments.length === 0) {
    navigate(`/plans/${planId}/cycles/${cycleId}`)
    return null
  }

  const executed = assignments.filter(a => a.status !== 'Unexecuted').length

  return (
    <div className="execution-page">
      <div className="breadcrumb body-sm text-muted">
        <Link to="/plans">Plans</Link> <span>/</span>
        <Link to={`/plans/${planId}`}>{plan.name}</Link> <span>/</span>
        <Link to={`/plans/${planId}/cycles/${cycleId}`}>{cycle.name}</Link> <span>/</span>
        <span>Execute</span>
      </div>

      <div className="execution-progress flex items-center justify-between" style={{ marginTop: 'var(--sp-3)' }}>
        <h1 className="title-sm">Execution — {executed} of {assignments.length} done</h1>
        <div className="progress-bar" style={{ width: 200 }}>
          <div className="fill" style={{ width: `${Math.round((executed / assignments.length) * 100)}%` }} />
        </div>
      </div>

      {current && (
        <div className="execution-card card" style={{ marginTop: 'var(--sp-6)' }}>
          <div className="execution-card-header flex items-center justify-between">
            <h2 className="title-sm">#{currentIndex + 1}: {current.test_case_title}</h2>
            {current.status !== 'Unexecuted' && (
              <span className={`status-badge status-${current.status.toLowerCase()}`}>{current.status}</span>
            )}
          </div>

          {current.test_case_description && (
            <p className="body-md text-muted" style={{ marginTop: 'var(--sp-3)' }}>{current.test_case_description}</p>
          )}

          {steps.length > 0 && (
            <div className="execution-steps" style={{ marginTop: 'var(--sp-4)' }}>
              <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>Steps</div>
              {steps.map((s) => (
                <div key={s.step} className="execution-step">
                  <span className="execution-step-num mono">{s.step}.</span>
                  <div className="execution-step-content">
                    <div className="body-md">{s.action}</div>
                    {s.expected && <div className="body-sm text-muted">Expected: {s.expected}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {current.test_case_expected_result && (
            <div style={{ marginTop: 'var(--sp-4)' }}>
              <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-1)' }}>Overall Expected Result</div>
              <p className="body-md">{current.test_case_expected_result}</p>
            </div>
          )}

          <div className="execution-bug-ref" style={{ marginTop: 'var(--sp-4)' }}>
            <label className="form-label">Bug Reference</label>
            <input
              className="input"
              value={bugRef}
              onChange={(e) => setBugRef(e.target.value)}
              placeholder="e.g., BUG-42"
              style={{ maxWidth: 300 }}
            />
            <span className="body-sm text-muted">Saved with Fail/Blocked status</span>
          </div>

          <div className="execution-actions" style={{ marginTop: 'var(--sp-6)' }}>
            <button className="btn execution-btn-pass" onClick={() => handleStatus('Pass')}>
              Pass <span className="body-sm">(P)</span>
            </button>
            <button className="btn execution-btn-fail" onClick={() => handleStatus('Fail')}>
              Fail <span className="body-sm">(F)</span>
            </button>
            <button className="btn execution-btn-blocked" onClick={() => handleStatus('Blocked')}>
              Blocked <span className="body-sm">(B)</span>
            </button>
          </div>
        </div>
      )}

      <div className="execution-nav flex items-center justify-between" style={{ marginTop: 'var(--sp-4)' }}>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
          &larr; Prev
        </button>
        <div className="flex items-center gap-2">
          <span className="body-sm text-muted">Case {currentIndex + 1} of {assignments.length}</span>
          <select
            className="select"
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            style={{ width: 200 }}
          >
            {assignments.map((a, i) => (
              <option key={a.id} value={i}>
                {i + 1}. {a.test_case_title} [{a.status}]
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setCurrentIndex(Math.min(assignments.length - 1, currentIndex + 1))} disabled={currentIndex === assignments.length - 1}>
          Next &rarr;
        </button>
      </div>
    </div>
  )
}
