import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, TestCaseAssignment } from '@shared/types'
import { TestCycleEnvironment } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import AssignmentPicker from '../components/execution/AssignmentPicker'
import './TestCycleDetailPage.css'

const getEnvironmentClass = (env: string | null) => {
  if (!env) return ''
  if (env === TestCycleEnvironment.DEV_CHEAT) return 'env-dev-cheat'
  if (env === TestCycleEnvironment.PROD_CHEAT) return 'env-prod-cheat'
  if (env === TestCycleEnvironment.PROD_NON_CHEAT) return 'env-prod-non-cheat'
  return ''
}

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
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<number>>(new Set())
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [collapsedSubcategories, setCollapsedSubcategories] = useState<Set<string>>(new Set())

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  const toggleSubcategory = (key: string) => {
    setCollapsedSubcategories(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

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

  const toggleRemoval = (id: number) => {
    const next = new Set(selectedForRemoval)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedForRemoval(next)
  }

  const toggleAllRemoval = () => {
    if (!assignments) return
    if (selectedForRemoval.size === assignments.length) {
      setSelectedForRemoval(new Set())
    } else {
      setSelectedForRemoval(new Set(assignments.map(a => a.id)))
    }
  }

  const handleBatchUnassign = async () => {
    if (selectedForRemoval.size === 0) return
    try {
      await window.api.assignments.batchUnassign(Array.from(selectedForRemoval))
      invalidate('assignments')
      notify(`${selectedForRemoval.size} test case(s) unassigned`, 'success')
      setSelectedForRemoval(new Set())
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

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
            {cycle.environment && <span className={`cycle-env-badge ${getEnvironmentClass(cycle.environment)}`}>{cycle.environment}</span>}
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
        {total > 0 && (
          <div className="cycle-table-header">
            <span className="section-title">
              Test Cases
              <span className="section-count">{total}</span>
            </span>
            <div className="cycle-table-actions">
              {selectedForRemoval.size > 0 && (
                <button className="btn btn-danger btn-sm" onClick={handleBatchUnassign}>
                  Unassign ({selectedForRemoval.size})
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)}>+ Assign Cases</button>
            </div>
          </div>
        )}

        {total === 0 ? (
          <div className="cycle-empty">
            <div className="cycle-empty-icon">📋</div>
            <p className="cycle-empty-title">No test cases assigned</p>
            <p className="cycle-empty-desc">Assign test cases from your library to start executing this cycle.</p>
            <button className="btn btn-primary" onClick={() => setShowPicker(true)}>+ Assign Cases</button>
          </div>
        ) : (
          <div className="grouped-assignments">
            {(() => {
              const grouped = new Map<string, Map<string, typeof assignments>>()
              assignments!.forEach(a => {
                if (!grouped.has(a.category_name)) grouped.set(a.category_name, new Map())
                const catMap = grouped.get(a.category_name)!
                if (!catMap.has(a.subcategory_name)) catMap.set(a.subcategory_name, [])
                catMap.get(a.subcategory_name)!.push(a)
              })

              return Array.from(grouped.entries()).map(([catName, subcatMap]) => {
                const isCatCollapsed = collapsedCategories.has(catName)
                const catTotal = Array.from(subcatMap.values()).reduce((acc, items) => acc + items!.length, 0)

                return (
                  <div key={catName} className="grouped-category">
                    <div className="grouped-category-header" onClick={() => toggleCategory(catName)}>
                      <span className="grouped-toggle">{isCatCollapsed ? '▶' : '▼'}</span>
                      <span className="grouped-category-name">{catName}</span>
                      <span className="section-count">{catTotal}</span>
                    </div>

                    {!isCatCollapsed && Array.from(subcatMap.entries()).map(([subcatName, cases]) => {
                      const subKey = `${catName}::${subcatName}`
                      const isSubCollapsed = collapsedSubcategories.has(subKey)

                      return (
                        <div key={subcatName} className="grouped-subcategory">
                          <div className="grouped-subcategory-header" onClick={() => toggleSubcategory(subKey)}>
                            <span className="grouped-toggle">{isSubCollapsed ? '▶' : '▼'}</span>
                            <span className="grouped-subcategory-name">{subcatName}</span>
                            <span className="section-count">{cases!.length}</span>
                          </div>

                          {!isSubCollapsed && (
                            <table className="data-table grouped-cases-table">
                              <thead>
                                <tr>
                                  <th className="col-checkbox">
                                    <input
                                      type="checkbox"
                                      checked={cases!.every(a => selectedForRemoval.has(a.id))}
                                      onChange={() => {
                                        const next = new Set(selectedForRemoval)
                                        const allSelected = cases!.every(a => next.has(a.id))
                                        cases!.forEach(a => allSelected ? next.delete(a.id) : next.add(a.id))
                                        setSelectedForRemoval(next)
                                      }}
                                    />
                                  </th>
                                  <th>Test Case</th>
                                  <th>Status</th>
                                  <th>Bug Ref</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cases!.map((a) => (
                                  <tr key={a.id} className={selectedForRemoval.has(a.id) ? 'row-selected' : ''}>
                                    <td className="col-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={selectedForRemoval.has(a.id)}
                                        onChange={() => toggleRemoval(a.id)}
                                      />
                                    </td>
                                    <td>{a.test_case_title}</td>
                                    <td><StatusBadge status={a.status} /></td>
                                    <td className="mono">{a.bug_ref || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })
            })()}
          </div>
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
