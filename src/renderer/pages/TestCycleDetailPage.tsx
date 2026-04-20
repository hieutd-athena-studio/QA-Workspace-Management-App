import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import type { TestPlan, TestCycle, TestCaseAssignment, UpdateTestCycleDTO, ExecutionStatus, TestType } from '@shared/types'
import { TestCycleEnvironment } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import { useProject } from '../contexts/ProjectContext'
import AssignmentPicker from '../components/execution/AssignmentPicker'
import './TestCycleDetailPage.css'

const getEnvironmentClass = (env: string | null) => {
  if (!env) return ''
  if (env === TestCycleEnvironment.DEV_CHEAT) return 'env-dev-cheat'
  if (env === TestCycleEnvironment.PROD_CHEAT) return 'env-prod-cheat'
  if (env === TestCycleEnvironment.PROD_NON_CHEAT) return 'env-prod-non-cheat'
  return ''
}

const STATUSES: ExecutionStatus[] = ['Pass', 'Fail', 'Blocked', 'Unexecuted']

function TestTypePicker({ projectId, onSelect, onClose }: { projectId: number; onSelect: (id: number) => void; onClose: () => void }) {
  const { data: testTypes, loading } = useApi<TestType[]>(
    () => window.api.testTypes.getByProject(projectId),
    [projectId],
    'testTypes'
  )
  return (
    <div className="tcf-overlay" onClick={onClose}>
      <div className="tcf-modal" onClick={e => e.stopPropagation()}>
        <div className="tcf-header">
          <span className="tcf-title">Import from Test Type</span>
          <button className="tcf-close" onClick={onClose}>✕</button>
        </div>
        <div className="tcf-body">
          <p className="tcf-hint">Select a test type to assign all its cases to this cycle.</p>
          {loading && <p className="text-muted">Loading…</p>}
          {!loading && (!testTypes || testTypes.length === 0) && (
            <p className="text-muted">No test types found. Create them in the Test Types section.</p>
          )}
          <div className="tt-picker-list">
            {testTypes?.map(tt => (
              <button key={tt.id} className="tt-picker-item" onClick={() => onSelect(tt.id)}>
                <span className="tt-picker-name">{tt.name}</span>
                <span className="tt-picker-count">{tt.test_case_count} case{tt.test_case_count !== 1 ? 's' : ''}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tcf-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status, onClick }: { status: string; onClick?: () => void }) {
  const cls = status === 'Pass' ? 'status-pass'
    : status === 'Fail' ? 'status-fail'
    : status === 'Blocked' ? 'status-blocked'
    : 'status-unexecuted'
  return (
    <span className={`status-badge ${cls}${onClick ? ' status-badge-clickable' : ''}`} onClick={onClick}>
      {status}
    </span>
  )
}

export default function TestCycleDetailPage() {
  const { planId, cycleId } = useParams<{ planId: string; cycleId: string }>()
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()

  const { selectedProject } = useProject()

  // Hero edit state
  const [showPicker, setShowPicker] = useState(false)
  const [showTestTypePicker, setShowTestTypePicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBuild, setEditBuild] = useState('')
  const [editEnv, setEditEnv] = useState<string | null>(null)

  // Unassign mode — checkboxes hidden until activated
  const [showUnassignMode, setShowUnassignMode] = useState(false)
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<number>>(new Set())

  // Accordion — default collapsed (empty = nothing expanded)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set())

  // Inline status editing
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null)

  // Arrange drag-and-drop
  const [showArrange, setShowArrange] = useState(false)
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(`cycle-cat-order-${cycleId}`)
    if (saved) {
      try { setCategoryOrder(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [cycleId])

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

  // Build grouped map
  const grouped = new Map<string, Map<string, TestCaseAssignment[]>>()
  assignments?.forEach(a => {
    const cat = a.category_name ?? ''
    const sub = a.subcategory_name ?? ''
    if (!grouped.has(cat)) grouped.set(cat, new Map())
    const catMap = grouped.get(cat)!
    if (!catMap.has(sub)) catMap.set(sub, [])
    catMap.get(sub)!.push(a)
  })

  // Apply user-defined category ordering, appending any new categories at the end
  const allCats = Array.from(grouped.keys())
  const orderedCategories = [
    ...categoryOrder.filter(c => allCats.includes(c)),
    ...allCats.filter(c => !categoryOrder.includes(c))
  ]

  // Accordion toggles
  const toggleCategory = (cat: string) =>
    setExpandedCategories(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })

  const toggleSubcategory = (key: string) =>
    setExpandedSubcategories(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  // Unassign
  const toggleRemoval = (id: number) =>
    setSelectedForRemoval(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleUnassignMode = () => {
    setShowUnassignMode(v => !v)
    setSelectedForRemoval(new Set())
  }

  const handleBatchUnassign = async () => {
    if (selectedForRemoval.size === 0) return
    try {
      await window.api.assignments.batchUnassign(Array.from(selectedForRemoval))
      invalidate('assignments')
      notify(`${selectedForRemoval.size} test case(s) unassigned`, 'success')
      setSelectedForRemoval(new Set())
      setShowUnassignMode(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  // Assign
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

  // Import from Test Type
  const handleImportTestType = async (testTypeId: number) => {
    try {
      const caseIds = await window.api.testTypes.getTestCaseIds(testTypeId)
      const assignedIds = new Set((assignments || []).map(a => a.test_case_id))
      const newIds = caseIds.filter(id => !assignedIds.has(id))
      if (newIds.length === 0) {
        notify('All cases from this test type are already assigned', 'info')
        setShowTestTypePicker(false)
        return
      }
      await window.api.assignments.assign(Number(cycleId), newIds)
      invalidate('assignments')
      notify(`${newIds.length} test case(s) imported from test type`, 'success')
      setShowTestTypePicker(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  // Hero edit
  const startEdit = () => {
    if (cycle) { setEditName(cycle.name); setEditBuild(cycle.build_name); setEditEnv(cycle.environment); setIsEditing(true) }
  }

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editBuild.trim()) return
    try {
      const dto: UpdateTestCycleDTO = { name: editName.trim(), build_name: editBuild.trim(), environment: editEnv || null }
      await window.api.testCycles.update(Number(cycleId), dto)
      invalidate('testCycles')
      notify('Test cycle updated', 'success')
      setIsEditing(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  // Inline status edit
  const handleStatusChange = async (assignmentId: number, newStatus: ExecutionStatus) => {
    try {
      await window.api.assignments.updateStatus(assignmentId, { status: newStatus })
      invalidate('assignments')
      setEditingStatusId(null)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  // Arrange drag-and-drop
  const handleDragStart = (idx: number) => setDragIndex(idx)
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx) }
  const handleDrop = (targetIdx: number) => {
    if (dragIndex === null || dragIndex === targetIdx) { setDragIndex(null); setDragOverIdx(null); return }
    const next = [...orderedCategories]
    const [removed] = next.splice(dragIndex, 1)
    next.splice(targetIdx, 0, removed)
    setCategoryOrder(next)
    setDragIndex(null)
    setDragOverIdx(null)
  }

  const saveArrange = () => {
    localStorage.setItem(`cycle-cat-order-${cycleId}`, JSON.stringify(categoryOrder))
    setShowArrange(false)
    notify('Category order saved', 'success')
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

      {/* Hero */}
      <div className="plan-detail-hero" style={{ marginBottom: 0 }}>
        {!isEditing ? (
          <>
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
              <button className="btn btn-secondary" onClick={startEdit}>✎ Edit</button>
              <button className="btn btn-secondary" onClick={() => setShowPicker(true)}>Assign Cases</button>
              <button className="btn btn-primary" onClick={() => navigate(`/plans/${planId}/cycles/${cycleId}/execute`)} disabled={total === 0}>▶ Execute</button>
              <button className="btn btn-secondary" onClick={() => navigate(`/reports?cycleId=${cycleId}`)} disabled={total === 0}>Report</button>
            </div>
          </>
        ) : (
          <>
            <div className="plan-detail-hero-info" style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Cycle Name</label>
                  <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Build Name</label>
                  <input className="input" value={editBuild} onChange={(e) => setEditBuild(e.target.value)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Environment</label>
                  <select className="input" value={editEnv || ''} onChange={(e) => setEditEnv(e.target.value || null)}>
                    <option value="">-- Select Environment --</option>
                    <option value={TestCycleEnvironment.DEV_CHEAT}>{TestCycleEnvironment.DEV_CHEAT}</option>
                    <option value={TestCycleEnvironment.PROD_CHEAT}>{TestCycleEnvironment.PROD_CHEAT}</option>
                    <option value={TestCycleEnvironment.PROD_NON_CHEAT}>{TestCycleEnvironment.PROD_NON_CHEAT}</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="plan-detail-hero-actions">
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveEdit} disabled={!editName.trim() || !editBuild.trim()}>Save</button>
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      {total > 0 && (
        <>
          <div className="cycle-stats-row">
            <div className="cycle-stat-card stat-pass"><span className="cycle-stat-value">{passed}</span><span className="cycle-stat-label">Passed</span></div>
            <div className="cycle-stat-card stat-fail"><span className="cycle-stat-value">{failed}</span><span className="cycle-stat-label">Failed</span></div>
            <div className="cycle-stat-card stat-blocked"><span className="cycle-stat-value">{blocked}</span><span className="cycle-stat-label">Blocked</span></div>
            <div className="cycle-stat-card stat-unexecuted"><span className="cycle-stat-value">{unexecuted}</span><span className="cycle-stat-label">Pending</span></div>
          </div>
          <div className="cycle-coverage-bar">
            <span className="cycle-coverage-label">Coverage</span>
            <div className="coverage-track"><div className="coverage-fill" style={{ width: `${coverage}%` }} /></div>
            <span className="cycle-coverage-pct">{coverage}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>{executed} of {total} executed</span>
          </div>
        </>
      )}

      {/* Test Cases */}
      <div className="cycle-table-section">
        {total > 0 && (
          <div className="cycle-table-header">
            <span className="section-title">
              Test Cases
              <span className="section-count">{total}</span>
            </span>
            <div className="cycle-table-actions">
              {showUnassignMode ? (
                <>
                  {selectedForRemoval.size > 0 && (
                    <button className="btn btn-danger btn-sm" onClick={handleBatchUnassign}>
                      Confirm Unassign ({selectedForRemoval.size})
                    </button>
                  )}
                  <button className="btn btn-secondary btn-sm" onClick={toggleUnassignMode}>Cancel</button>
                </>
              ) : (
                <>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowArrange(true)}>⇅ Arrange</button>
                  <button className="btn btn-secondary btn-sm" onClick={toggleUnassignMode}>Unassign</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowTestTypePicker(true)}>⚡ Test Type</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)}>+ Assign Cases</button>
                </>
              )}
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
            {orderedCategories.map(catName => {
              const subcatMap = grouped.get(catName)!
              const isCatExpanded = expandedCategories.has(catName)
              const catTotal = Array.from(subcatMap.values()).reduce((sum, items) => sum + items.length, 0)

              return (
                <div key={catName} className="grouped-category">
                  <div className="grouped-category-header" onClick={() => toggleCategory(catName)}>
                    <span className="grouped-toggle">{isCatExpanded ? '▼' : '▶'}</span>
                    <span className="grouped-category-name">{catName}</span>
                    <span className="section-count">{catTotal}</span>
                  </div>

                  {isCatExpanded && Array.from(subcatMap.entries()).map(([subcatName, cases]) => {
                    const subKey = `${catName}::${subcatName}`
                    const isSubExpanded = expandedSubcategories.has(subKey)

                    return (
                      <div key={subcatName} className="grouped-subcategory">
                        <div className="grouped-subcategory-header" onClick={() => toggleSubcategory(subKey)}>
                          <span className="grouped-toggle">{isSubExpanded ? '▼' : '▶'}</span>
                          <span className="grouped-subcategory-name">{subcatName}</span>
                          <span className="section-count">{cases.length}</span>
                        </div>

                        {isSubExpanded && (
                          <table className="data-table grouped-cases-table">
                            <colgroup>
                              {showUnassignMode && <col className="col-check" />}
                              <col className="col-title" />
                              <col className="col-status" />
                              <col className="col-bugref" />
                            </colgroup>
                            <thead>
                              <tr>
                                {showUnassignMode && (
                                  <th>
                                    <input
                                      type="checkbox"
                                      checked={cases.every(a => selectedForRemoval.has(a.id))}
                                      onChange={() => {
                                        const next = new Set(selectedForRemoval)
                                        const allSelected = cases.every(a => next.has(a.id))
                                        cases.forEach(a => allSelected ? next.delete(a.id) : next.add(a.id))
                                        setSelectedForRemoval(next)
                                      }}
                                    />
                                  </th>
                                )}
                                <th>Test Case</th>
                                <th>Status</th>
                                <th>Bug Ref</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cases.map(a => (
                                <tr key={a.id} className={selectedForRemoval.has(a.id) ? 'row-selected' : ''}>
                                  {showUnassignMode && (
                                    <td>
                                      <input
                                        type="checkbox"
                                        checked={selectedForRemoval.has(a.id)}
                                        onChange={() => toggleRemoval(a.id)}
                                      />
                                    </td>
                                  )}
                                  <td>{a.test_case_title}</td>
                                  <td>
                                    {editingStatusId === a.id ? (
                                      <select
                                        className="status-inline-select"
                                        autoFocus
                                        value={a.status}
                                        onChange={(e) => handleStatusChange(a.id, e.target.value as ExecutionStatus)}
                                        onBlur={() => setEditingStatusId(null)}
                                      >
                                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                    ) : (
                                      <StatusBadge status={a.status} onClick={() => setEditingStatusId(a.id)} />
                                    )}
                                  </td>
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
            })}
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

      {showTestTypePicker && selectedProject && (
        <TestTypePicker
          projectId={selectedProject.id}
          onSelect={handleImportTestType}
          onClose={() => setShowTestTypePicker(false)}
        />
      )}

      {/* Arrange modal */}
      {showArrange && (
        <div className="tcf-overlay" onClick={() => setShowArrange(false)}>
          <div className="tcf-modal arrange-modal" onClick={e => e.stopPropagation()}>
            <h2 className="tcf-title">Arrange Categories</h2>
            <p className="arrange-hint">Drag to set execution order</p>
            <div className="arrange-list">
              {orderedCategories.map((cat, idx) => (
                <div
                  key={cat}
                  className={`arrange-item${dragOverIdx === idx ? ' arrange-drag-over' : ''}`}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIdx(null) }}
                >
                  <span className="arrange-handle">⠿</span>
                  <span className="arrange-cat-name">{cat}</span>
                  <span className="section-count">{grouped.get(cat)?.size ?? 0} sub</span>
                </div>
              ))}
            </div>
            <div className="tcf-footer">
              <button className="btn btn-secondary" onClick={() => setShowArrange(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveArrange}>Save Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
