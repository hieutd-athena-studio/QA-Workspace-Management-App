import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, TestCaseAssignment } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import AssignmentPicker from '../components/execution/AssignmentPicker'
import EmptyState from '../components/shared/EmptyState'
import './TestCycleDetailPage.css'

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'Pass' ? 'status-pass' : status === 'Fail' ? 'status-fail' : status === 'Blocked' ? 'status-blocked' : 'status-unexecuted'
  return <span className={`status-badge ${cls}`}>{status}</span>
}

export default function TestCycleDetailPage() {
  const { planId, cycleId } = useParams<{ planId: string; cycleId: string }>()
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [showPicker, setShowPicker] = useState(false)

  const { data: plan } = useApi<TestPlan>(
    () => window.api.testPlans.getById(Number(planId)),
    [planId], 'testPlans'
  )

  const { data: cycle } = useApi<TestCycle>(
    () => window.api.testCycles.getById(Number(cycleId)),
    [cycleId], 'testCycles'
  )

  const { data: assignments } = useApi<TestCaseAssignment[]>(
    () => window.api.assignments.getByCycle(Number(cycleId)),
    [cycleId], 'assignments'
  )

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

  if (!plan || !cycle) return <div className="text-muted">Loading...</div>

  return (
    <div className="cycle-detail-page">
      <div className="breadcrumb body-sm text-muted">
        <Link to="/plans">Test Plans</Link> <span>/</span>
        <Link to={`/plans/${planId}`}>{plan.name}</Link> <span>/</span>
        <span>{cycle.name}</span>
      </div>

      <div className="cycle-detail-header flex items-center justify-between" style={{ marginTop: 'var(--sp-3)' }}>
        <div>
          <h1 className="headline-sm">{cycle.name}</h1>
          <p className="body-sm text-muted">{cycle.build_name}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)}>Assign Cases</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/plans/${planId}/cycles/${cycleId}/execute`)}
            disabled={total === 0}
          >Execute</button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/reports?cycleId=${cycleId}`)}
            disabled={total === 0}
          >Report</button>
        </div>
      </div>

      {total > 0 && (
        <div className="summary-bar" style={{ marginTop: 'var(--sp-6)' }}>
          <div className="summary-stats flex gap-4">
            <div className="stat-chip stat-pass"><strong>{passed}</strong> Pass</div>
            <div className="stat-chip stat-fail"><strong>{failed}</strong> Fail</div>
            <div className="stat-chip stat-blocked"><strong>{blocked}</strong> Blocked</div>
            <div className="stat-chip stat-unexecuted"><strong>{unexecuted}</strong> Todo</div>
          </div>
          <div className="flex items-center gap-3" style={{ marginTop: 'var(--sp-3)' }}>
            <span className="body-sm text-muted">Coverage: {coverage}% ({executed}/{total})</span>
            <div className="progress-bar flex-1">
              <div className="fill" style={{ width: `${coverage}%` }} />
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 'var(--sp-6)' }}>
        {total === 0 ? (
          <EmptyState
            icon="&#128196;"
            title="No test cases assigned"
            description="Assign test cases from the library to start testing."
            actionLabel="Assign Cases"
            onAction={() => setShowPicker(true)}
          />
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
