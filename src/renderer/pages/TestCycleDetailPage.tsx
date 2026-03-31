import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, TestCaseAssignment } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import AssignmentPicker from '../components/execution/AssignmentPicker'
import './TestCycleDetailPage.css'

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'Pass' ? 'status-pass'
    : status === 'Fail' ? 'status-fail'
    : status === 'Blocked' ? 'status-blocked'
    : 'status-unexecuted'
  return <span className={`status-badge ${cls}`}>{status}</span>
}

export default function TestCycleDetailPage() {
  const { planId, cycleId } = useParams<{ planId: string; cycleId: string }>()
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [showPicker, setShowPicker] = useState(false)

  const { data: plan } = useApi<TestPlan>(() => window.api.testPlans.getById(Number(planId)), [planId], 'testPlans')
  const { data: cycle } = useApi<TestCycle>(() => window.api.testCycles.getById(Number(cycleId)), [cycleId], 'testCycles')
  const { data: assignments } = useApi<TestCaseAssignment[]>(() => window.api.assignments.getByCycle(Number(cycleId)), [cycleId], 'assignments')

  const total = assignments?.length || 0
  const passed = assignments?.filter(a => a.status === 'Pass').length || 0
  const failed = assignments?.filter(a => a.status === 'Fail').length || 0
  const blocked = assignments?.filter(a => a.status === 'Blocked').length || 0
  const unexecuted = assignments?.filter(a => a.status === 'Unexecuted').length || 0
  const executed = total - unexecuted
  const coverage = total > 0 ? Math.round((executed / total) * 100) : 0

  const handleAssign = async (testCaseIds: number[]) => {
    try {
      await window.api.assignments.assign(Number(cycleId), testCaseIds)
      invalidate('assignments')
      notify(`${testCaseIds.length} test case(s) assigned`, 'success')
      setShowPicker(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  if (!plan || !cycle) return <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)' }}>Loading…</div>

  return (
    <div className="cycle-detail-page">
      <div className="breadcrumb">
        <Link to="/plans">Test Plans</Link>
        <span className="breadcrumb-sep">›</span>
        <Link to={`/plans/${planId}`}>{plan.name}</Link>
        <span className="breadcrumb-sep">›</span>
        <span>{cycle.name}</span>
      </div>

      {/* Plan detail hero reused */}
      <div className="plan-detail-hero" style={{ marginBottom: 0 }}>
        <div className="plan-detail-hero-info">
          <div className="plan-detail-hero-title">
            <h1>{cycle.name}</h1>
            <span className="cycle-build-badge">{cycle.build_name}</span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-variant)' }}>
            Part of <strong>{plan.name}</strong> {plan.version}
          </div>
        </div>
        <div className="plan-detail-hero-actions">
          <button className="btn btn-secondary" onClick={() => setShowPicker(true)}>Assign Cases</button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/plans/${planId}/cycles/${cycleId}/execute`)}
            disabled={total === 0}
          >▶ Execute</button>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/reports?cycleId=${cycleId}`)}
            disabled={total === 0}
          >Report</button>
        </div>
      </div>

      {/* Stats cards */}
      {total > 0 && (
        <>
          <div className="cycle-stats-row">
            <div className="cycle-stat-card stat-pass">
              <span className="cycle-stat-value">{passed}</span>
              <span className="cycle-stat-label">Passed</span>
            </div>
            <div className="cycle-stat-card stat-fail">
              <span className="cycle-stat-value">{failed}</span>
              <span className="cycle-stat-label">Failed</span>
            </div>
            <div className="cycle-stat-card stat-blocked">
              <span className="cycle-stat-value">{blocked}</span>
              <span className="cycle-stat-label">Blocked</span>
            </div>
            <div className="cycle-stat-card stat-unexecuted">
              <span className="cycle-stat-value">{unexecuted}</span>
              <span className="cycle-stat-label">Pending</span>
            </div>
          </div>

          <div className="cycle-coverage-bar">
            <span className="cycle-coverage-label">Coverage</span>
            <div className="coverage-track">
              <div className="coverage-fill" style={{ width: `${coverage}%` }} />
            </div>
            <span className="cycle-coverage-pct">{coverage}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>
              {executed} of {total} executed
            </span>
          </div>
        </>
      )}

      {/* Assignments */}
      <div className="cycle-table-section">
        <div className="cycle-table-header">
          <span className="section-title">
            Test Cases
            {total > 0 && <span className="section-count">{total}</span>}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)}>+ Assign Cases</button>
        </div>

        {total === 0 ? (
          <div className="cycle-empty">
            <div className="cycle-empty-icon">📋</div>
            <p className="cycle-empty-title">No test cases assigned</p>
            <p className="cycle-empty-desc">Assign test cases from your library to start executing this cycle.</p>
            <button className="btn btn-primary" onClick={() => setShowPicker(true)}>+ Assign Cases</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Folder</th>
                <th>Test Case</th>
                <th>Status</th>
                <th>Bug Ref</th>
              </tr>
            </thead>
            <tbody>
              {assignments!.map((a) => (
                <tr key={a.id}>
                  <td className="secondary">{a.folder_path}</td>
                  <td>{a.test_case_title}</td>
                  <td><StatusBadge status={a.status} /></td>
                  <td className="mono">{a.bug_ref || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPicker && (
        <AssignmentPicker
          cycleId={Number(cycleId)}
          existingAssignments={assignments || []}
          onAssign={handleAssign}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
