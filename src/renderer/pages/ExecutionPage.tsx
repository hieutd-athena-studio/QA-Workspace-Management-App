import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  const hasInitialized = useRef(false)

  const { data: plan } = useApi<TestPlan>(() => window.api.testPlans.getById(Number(planId)), [planId])
  const { data: cycle } = useApi<TestCycle>(() => window.api.testCycles.getById(Number(cycleId)), [cycleId])
  const { data: assignments, refetch } = useApi<TestCaseAssignment[]>(
    () => window.api.assignments.getByCycle(Number(cycleId)), [cycleId], 'assignments'
  )

  const current = assignments?.[currentIndex]
  const steps = current?.test_case_steps ? parseSteps(current.test_case_steps) : []

  // On first load, jump to the first unexecuted test case
  useEffect(() => {
    if (!assignments || hasInitialized.current) return
    hasInitialized.current = true
    const firstUnexecuted = assignments.findIndex(a => a.status === 'Unexecuted')
    if (firstUnexecuted !== -1) setCurrentIndex(firstUnexecuted)
  }, [assignments])

  useEffect(() => {
    if (current) setBugRef(current.bug_ref || '')
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

  if (!plan || !cycle || !assignments) return <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)' }}>Loading…</div>
  if (assignments.length === 0) { navigate(`/plans/${planId}/cycles/${cycleId}`); return null }

  const executed = assignments.filter(a => a.status !== 'Unexecuted').length
  const progressPct = Math.round((executed / assignments.length) * 100)

  return (
    <div className="execution-page">
      <div className="breadcrumb">
        <Link to="/plans">Plans</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/plans/${planId}`}>{plan.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/plans/${planId}/cycles/${cycleId}`}>{cycle.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>Execute</span>
      </div>

      <div className="execution-header">
        <span className="execution-title">Test Execution</span>
        <div className="execution-progress-wrap">
          <span className="execution-progress-label">{executed}/{assignments.length}</span>
          <div className="execution-progress-track">
            <div className="execution-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="execution-progress-label">{progressPct}%</span>
        </div>
      </div>

      {current && (
        <div className="execution-card">
          <div className="execution-card-top">
            <div>
              <div className="execution-case-number">Case {currentIndex + 1} of {assignments.length}</div>
              <div className="execution-case-title">{current.test_case_title}</div>
            </div>
            {current.status !== 'Unexecuted' && (
              <span className={`status-badge status-${current.status.toLowerCase()}`}>{current.status}</span>
            )}
          </div>

          {current.test_case_description && (
            <p className="execution-description">{current.test_case_description}</p>
          )}

          {steps.length > 0 && (
            <div>
              <div className="execution-steps-label">Steps</div>
              <div className="execution-steps">
                {steps.map((s) => (
                  <div key={s.step} className="execution-step">
                    <span className="execution-step-num">{s.step}</span>
                    <div className="execution-step-content">
                      <div className="execution-step-action">{s.action}</div>
                      {s.expected && <div className="execution-step-expected">Expected: {s.expected}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.test_case_expected_result && (
            <div className="execution-expected-block">
              <div className="execution-expected-label">Overall Expected Result</div>
              <p className="execution-expected-text">{current.test_case_expected_result}</p>
            </div>
          )}

          <div className="execution-bug-ref">
            <label className="execution-bug-ref-label">Bug Reference</label>
            <input
              className="input"
              value={bugRef}
              onChange={(e) => setBugRef(e.target.value)}
              placeholder="e.g., BUG-42"
              style={{ maxWidth: 280 }}
            />
            <span className="execution-bug-ref-hint">Attached to Fail / Blocked results</span>
          </div>

          <div className="execution-actions">
            <button className="execution-btn execution-btn-pass" onClick={() => handleStatus('Pass')}>
              Pass <span className="execution-btn-key">P</span>
            </button>
            <button className="execution-btn execution-btn-fail" onClick={() => handleStatus('Fail')}>
              Fail <span className="execution-btn-key">F</span>
            </button>
            <button className="execution-btn execution-btn-blocked" onClick={() => handleStatus('Blocked')}>
              Blocked <span className="execution-btn-key">B</span>
            </button>
          </div>
        </div>
      )}

      <div className="execution-nav">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >← Prev</button>
        <div className="execution-nav-center">
          <span className="execution-nav-label">Jump to:</span>
          <select
            className="select"
            value={currentIndex}
            onChange={(e) => setCurrentIndex(Number(e.target.value))}
            style={{ width: 220 }}
          >
            {assignments.map((a, i) => (
              <option key={a.id} value={i}>
                {i + 1}. {a.test_case_title} [{a.status}]
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCurrentIndex(Math.min(assignments.length - 1, currentIndex + 1))}
          disabled={currentIndex === assignments.length - 1}
        >Next →</button>
      </div>
    </div>
  )
}
