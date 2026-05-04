import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, TestCaseAssignment, ExecutionStatus } from '@shared/types'
import { parseSteps } from '@shared/utils/steps'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import './ExecutionPage.css'

function statusDotColor(status: ExecutionStatus): string {
  if (status === 'Pass')    return 'var(--success)'
  if (status === 'Fail')    return 'var(--critical)'
  if (status === 'Blocked') return 'var(--warning)'
  return 'var(--on-surface-variant)'
}

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

  // Apply user-defined category order from localStorage (same logic as TestCycleDetailPage)
  const orderedAssignments = React.useMemo(() => {
    if (!assignments) return []
    const saved = localStorage.getItem(`cycle-cat-order-${cycleId}`)
    if (!saved) return assignments
    try {
      const categoryOrder: string[] = JSON.parse(saved)
      const allCats = Array.from(new Set(assignments.map(a => a.category_name ?? '')))
      const orderedCats = [
        ...categoryOrder.filter(c => allCats.includes(c)),
        ...allCats.filter(c => !categoryOrder.includes(c))
      ]
      return [...assignments].sort((a, b) => {
        const ai = orderedCats.indexOf(a.category_name ?? '')
        const bi = orderedCats.indexOf(b.category_name ?? '')
        if (ai !== bi) return ai - bi
        return (a.subcategory_name ?? '').localeCompare(b.subcategory_name ?? '') ||
               (a.test_case_title ?? '').localeCompare(b.test_case_title ?? '')
      })
    } catch { return assignments }
  }, [assignments, cycleId])

  // Group for left panel: category → subcategory → cases
  const groupedAssignments = React.useMemo(() => {
    const map = new Map<string, Map<string, TestCaseAssignment[]>>()
    for (const a of orderedAssignments) {
      const cat = a.category_name ?? ''
      const sub = a.subcategory_name ?? ''
      if (!map.has(cat)) map.set(cat, new Map())
      const subMap = map.get(cat)!
      if (!subMap.has(sub)) subMap.set(sub, [])
      subMap.get(sub)!.push(a)
    }
    return map
  }, [orderedAssignments])

  const current = orderedAssignments[currentIndex]
  const steps = current?.test_case_steps ? parseSteps(current.test_case_steps) : []

  // On first load, jump to the first unexecuted test case
  useEffect(() => {
    if (!orderedAssignments.length || hasInitialized.current) return
    hasInitialized.current = true
    const firstUnexecuted = orderedAssignments.findIndex(a => a.status === 'Unexecuted')
    if (firstUnexecuted !== -1) setCurrentIndex(firstUnexecuted)
  }, [orderedAssignments])

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
      if (currentIndex < orderedAssignments.length - 1) {
        setCurrentIndex(currentIndex + 1)
      }
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }, [current, bugRef, currentIndex, orderedAssignments.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'p' || e.key === 'P') handleStatus('Pass')
      else if (e.key === 'f' || e.key === 'F') handleStatus('Fail')
      else if (e.key === 'b' || e.key === 'B') handleStatus('Blocked')
      else if (e.key === 'ArrowLeft' && currentIndex > 0) setCurrentIndex(currentIndex - 1)
      else if (e.key === 'ArrowRight' && currentIndex < orderedAssignments.length - 1) setCurrentIndex(currentIndex + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleStatus, currentIndex, orderedAssignments.length])

  if (!plan || !cycle || !assignments) return <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)' }}>Loading…</div>
  if (orderedAssignments.length === 0) { navigate(`/plans/${planId}/cycles/${cycleId}`); return null }

  const executed = orderedAssignments.filter(a => a.status !== 'Unexecuted').length
  const progressPct = Math.round((executed / orderedAssignments.length) * 100)

  return (
    <div className="execution-page">

      {/* ── LEFT PANEL ─────────────────────────────────────────────── */}
      <aside className="exec-panel">
        <div className="exec-panel-header">
          <div className="exec-panel-progress-row">
            <span className="exec-panel-count">{executed}/{orderedAssignments.length}</span>
            <span className="exec-panel-pct">{progressPct}%</span>
          </div>
          <div className="exec-panel-track">
            <div className="exec-panel-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className="exec-panel-list">
          {Array.from(groupedAssignments.entries()).map(([catName, subMap]) => (
            <div key={catName} className="exec-panel-cat-group">
              <div className="exec-panel-cat">
                {catName || <span className="exec-panel-cat-empty">Uncategorized</span>}
              </div>
              {Array.from(subMap.entries()).map(([subName, cases]) => (
                <div key={subName} className="exec-panel-sub-group">
                  {subName && <div className="exec-panel-sub">{subName}</div>}
                  {cases.map((a) => {
                    const idx = orderedAssignments.indexOf(a)
                    const isActive = idx === currentIndex
                    return (
                      <button
                        key={a.id}
                        className={`exec-panel-item${isActive ? ' exec-panel-item-active' : ''}`}
                        onClick={() => setCurrentIndex(idx)}
                        title={a.test_case_title ?? ''}
                      >
                        <span
                          className="exec-panel-dot"
                          style={{ background: statusDotColor(a.status) }}
                        />
                        <span className="exec-panel-item-title">
                          {a.test_case_title ?? '(untitled)'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT MAIN ─────────────────────────────────────────────── */}
      <div className="exec-main">
        <div className="breadcrumb">
          <Link to="/plans">Plans</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/plans/${planId}`}>{plan.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <Link to={`/plans/${planId}/cycles/${cycleId}`}>{cycle.name}</Link>
          <span className="breadcrumb-sep">›</span>
          <span>Execute</span>
        </div>

        {current && (
          <div className="execution-card">
            <div className="execution-card-top">
              <div>
                <div className="execution-case-number">Case {currentIndex + 1} of {orderedAssignments.length}</div>
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
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setCurrentIndex(Math.min(orderedAssignments.length - 1, currentIndex + 1))}
            disabled={currentIndex === orderedAssignments.length - 1}
          >Next →</button>
        </div>
      </div>

    </div>
  )
}
