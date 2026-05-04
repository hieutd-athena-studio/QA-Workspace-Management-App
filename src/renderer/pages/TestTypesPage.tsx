import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TestType, Category, Subcategory, TestCase } from '@shared/types'
import { useProject } from '../contexts/ProjectContext'
import { useApi } from '../hooks/useApi'
import { useNotification } from '../contexts/NotificationContext'
import { useInvalidation } from '../contexts/InvalidationContext'
import './TestTypesPage.css'
import '../components/execution/AssignmentPicker.css'

// --- Sub-components ---

interface CreateModalProps {
  onSave: (name: string) => void
  onClose: () => void
}
const CreateModal = ({ onSave, onClose }: CreateModalProps) => {
  const [name, setName] = useState('')
  return (
    <div className="tcf-overlay" onClick={onClose}>
      <div className="tcf-modal" onClick={e => e.stopPropagation()}>
        <div className="tcf-header">
          <span className="tcf-title">New Test Type</span>
          <button className="tcf-close" onClick={onClose}>✕</button>
        </div>
        <div className="tcf-field">
          <label className="tcf-label">Name</label>
          <input
            className="input"
            placeholder="e.g. Smoke Testing"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
            autoFocus
          />
        </div>
        <div className="tcf-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={() => onSave(name.trim())}>Create</button>
        </div>
      </div>
    </div>
  )
}

interface RenameModalProps {
  current: string
  onSave: (name: string) => void
  onClose: () => void
}
const RenameModal = ({ current, onSave, onClose }: RenameModalProps) => {
  const [name, setName] = useState(current)
  return (
    <div className="tcf-overlay" onClick={onClose}>
      <div className="tcf-modal" onClick={e => e.stopPropagation()}>
        <div className="tcf-header">
          <span className="tcf-title">Rename Test Type</span>
          <button className="tcf-close" onClick={onClose}>✕</button>
        </div>
        <div className="tcf-field">
          <label className="tcf-label">Name</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onSave(name.trim())}
            autoFocus
          />
        </div>
        <div className="tcf-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!name.trim()} onClick={() => onSave(name.trim())}>Save</button>
        </div>
      </div>
    </div>
  )
}

interface ManageCasesModalProps {
  testType: TestType
  selectedIds: Set<number>
  categories: Category[]
  subcategories: Subcategory[]
  onToggle: (id: number) => void
  onBatchAdd: (ids: number[]) => Promise<void>
  onBatchRemove: (ids: number[]) => Promise<void>
  onClose: () => void
  projectId: number
}
const ManageCasesModal = ({ testType, selectedIds, categories, subcategories, onToggle, onBatchAdd, onBatchRemove, onClose }: ManageCasesModalProps) => {
  const [selectedSub, setSelectedSub] = useState<Subcategory | null>(null)
  const [selectedCats, setSelectedCats] = useState<Set<number>>(new Set())
  const [allTestCases, setAllTestCases] = useState<Map<number, TestCase[]>>(new Map())

  const { data: testCases } = useApi<TestCase[]>(
    () => selectedSub ? window.api.testCases.getBySubcategory(selectedSub.id) : Promise.resolve([]),
    [selectedSub?.id]
  )

  React.useEffect(() => {
    if (selectedSub && testCases) {
      setAllTestCases(prev => new Map(prev).set(selectedSub.id, testCases))
    }
  }, [selectedSub?.id, testCases])

  React.useEffect(() => {
    const loadAllCases = async () => {
      const map = new Map<number, TestCase[]>()
      for (const sub of subcategories) {
        try {
          const cases = await window.api.testCases.getBySubcategory(sub.id) as TestCase[]
          map.set(sub.id, cases)
        } catch { /* skip */ }
      }
      setAllTestCases(map)
    }
    if (subcategories.length > 0) {
      loadAllCases()
    }
  }, [subcategories])

  const subsForCat = (catId: number) => subcategories.filter(s => s.category_id === catId)

  const getCountsForCat = (catId: number) => {
    const subs = subsForCat(catId)
    let total = 0, selected = 0
    for (const sub of subs) {
      const cases = allTestCases.get(sub.id) || []
      total += cases.length
      selected += cases.filter(tc => selectedIds.has(tc.id)).length
    }
    return { selected, total }
  }

  const getCountsForSub = (subId: number) => {
    const cases = allTestCases.get(subId) || testCases || []
    const total = cases.length
    const selected = cases.filter(tc => selectedIds.has(tc.id)).length
    return { selected, total }
  }

  const selectAllInSubcategory = async () => {
    if (!testCases) return
    const allSelected = testCases.every(tc => selectedIds.has(tc.id))
    const ids = testCases.map(tc => tc.id)
    if (allSelected) {
      await onBatchRemove(ids)
    } else {
      await onBatchAdd(ids.filter(id => !selectedIds.has(id)))
    }
  }

  const toggleAllInCategory = async (catId: number) => {
    const subs = subsForCat(catId)
    const allIds: number[] = []
    for (const sub of subs) {
      try {
        const cases = await window.api.testCases.getBySubcategory(sub.id) as TestCase[]
        allIds.push(...cases.map(tc => tc.id))
      } catch { /* skip */ }
    }
    const isSelected = selectedCats.has(catId)
    if (isSelected) {
      await onBatchRemove(allIds.filter(id => selectedIds.has(id)))
    } else {
      await onBatchAdd(allIds.filter(id => !selectedIds.has(id)))
    }
    setSelectedCats(prev => {
      const next = new Set(prev)
      isSelected ? next.delete(catId) : next.add(catId)
      return next
    })
  }

  const allSubSelected = testCases ? testCases.length > 0 && testCases.every(tc => selectedIds.has(tc.id)) : false

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Cases — {testType.name}</h2>
        </div>

        <div className="picker-layout">
          <div className="picker-folders">
            <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>Categories</div>
            {categories.length === 0 ? (
              <div className="body-sm text-muted">No categories</div>
            ) : categories.map(cat => (
              <React.Fragment key={cat.id}>
                <div className="picker-category-header">
                  <span>{cat.name}</span>
                  <button
                    className="picker-select-all-btn"
                    onClick={e => { e.stopPropagation(); toggleAllInCategory(cat.id) }}
                    title={selectedCats.has(cat.id) ? `Deselect all in ${cat.name}` : `Select all in ${cat.name}`}
                  >
                    {(() => {
                      const { selected, total } = getCountsForCat(cat.id)
                      return total === 0 ? 'No cases' : `${selected}/${total}`
                    })()}
                  </button>
                </div>
                {subsForCat(cat.id).map(sub => (
                  <div
                    key={sub.id}
                    className={`picker-folder picker-subfolder ${selectedSub?.id === sub.id ? 'picker-folder-active' : ''}`}
                    onClick={() => setSelectedSub(sub)}
                  >
                    {sub.name}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          <div className="picker-cases">
            <div className="picker-cases-header">
              <span className="label-md text-muted">
                Test Cases{selectedSub ? ` in ${selectedSub.name}` : ''}
              </span>
              {selectedSub && testCases && testCases.length > 0 && (
                <button className="picker-select-all-btn" onClick={selectAllInSubcategory}>
                  {(() => {
                    const { selected, total } = getCountsForSub(selectedSub.id)
                    return allSubSelected ? `${selected}/${total} (deselect all)` : `${selected}/${total} (select all)`
                  })()}
                </button>
              )}
            </div>
            {!selectedSub ? (
              <div className="body-sm text-muted">Select a subcategory</div>
            ) : !testCases?.length ? (
              <div className="body-sm text-muted">No test cases in this subcategory</div>
            ) : (
              <div className="picker-case-list">
                {testCases.map(tc => (
                  <label key={tc.id} className="picker-case-item">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(tc.id)}
                      onChange={() => onToggle(tc.id)}
                    />
                    <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)', minWidth: 80, flexShrink: 0 }}>{tc.display_id}</span>
                    <span>{tc.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <span className="body-sm text-muted">{selectedIds.size} case{selectedIds.size !== 1 ? 's' : ''} selected</span>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

// --- Export Selection Modal ---

interface ExportModalProps {
  testTypes: TestType[]
  onExport: (ids: number[]) => void
  onClose: () => void
}
const ExportModal = ({ testTypes, onExport, onClose }: ExportModalProps) => {
  const [selected, setSelected] = useState<Set<number>>(new Set(testTypes.map(tt => tt.id)))

  const toggle = (id: number) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const toggleAll = () => setSelected(
    selected.size === testTypes.length ? new Set() : new Set(testTypes.map(tt => tt.id))
  )

  return (
    <div className="tcf-overlay" onClick={onClose}>
      <div className="tcf-modal" onClick={e => e.stopPropagation()}>
        <div className="tcf-header">
          <span className="tcf-title">Export Test Types</span>
          <button className="tcf-close" onClick={onClose}>✕</button>
        </div>
        <div className="tcf-body">
          <p className="tcf-hint">Select test types to export as a JSON file.</p>
          <label className="picker-case-item" style={{ marginBottom: 'var(--sp-2)', fontWeight: 600 }}>
            <input type="checkbox" checked={selected.size === testTypes.length} onChange={toggleAll} />
            <span>Select all</span>
          </label>
          <div className="picker-case-list">
            {testTypes.map(tt => (
              <label key={tt.id} className="picker-case-item">
                <input type="checkbox" checked={selected.has(tt.id)} onChange={() => toggle(tt.id)} />
                <span>{tt.name}</span>
                <span className="tt-card-count">{tt.test_case_count} case{tt.test_case_count !== 1 ? 's' : ''}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="tcf-footer">
          <span className="body-sm text-muted">{selected.size} selected</span>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={selected.size === 0} onClick={() => onExport(Array.from(selected))}>Export</button>
        </div>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function TestTypesPage() {
  const { selectedProject } = useProject()
  const { notify } = useNotification()
  const { invalidate } = useInvalidation()
  const navigate = useNavigate()

  const [showCreate, setShowCreate] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [renaming, setRenaming] = useState<TestType | null>(null)
  const [managing, setManaging] = useState<TestType | null>(null)
  const [managedIds, setManagedIds] = useState<Set<number>>(new Set())

  const { data: testTypes, loading } = useApi<TestType[]>(
    () => selectedProject ? window.api.testTypes.getByProject(selectedProject.id) : Promise.resolve([]),
    [selectedProject?.id, 'testTypes'],
    'testTypes'
  )

  const { data: categories } = useApi<Category[]>(
    () => selectedProject ? window.api.categories.getByProject(selectedProject.id) : Promise.resolve([]),
    [selectedProject?.id],
    'categories'
  )

  const { data: subcategories } = useApi<Subcategory[]>(
    () => selectedProject ? window.api.subcategories.getByProject(selectedProject.id) : Promise.resolve([]),
    [selectedProject?.id],
    'subcategories'
  )

  if (!selectedProject) return (
    <div className="no-project-guard">
      <p className="no-project-guard-title">No project selected</p>
      <p className="no-project-guard-desc">Select a project to manage test types.</p>
      <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
    </div>
  )

  const handleCreate = async (name: string) => {
    try {
      await window.api.testTypes.create({ name, project_id: selectedProject.id })
      invalidate('testTypes')
      notify(`Test type "${name}" created`, 'success')
      setShowCreate(false)
    } catch (e: unknown) { notify((e as Error).message, 'error') }
  }

  const handleRename = async (name: string) => {
    if (!renaming) return
    try {
      await window.api.testTypes.update(renaming.id, { name })
      invalidate('testTypes')
      notify('Test type renamed', 'success')
      setRenaming(null)
    } catch (e: unknown) { notify((e as Error).message, 'error') }
  }

  const handleDelete = async (tt: TestType) => {
    if (!confirm(`Delete "${tt.name}"? This will remove it and all its case links.`)) return
    try {
      await window.api.testTypes.delete(tt.id)
      invalidate('testTypes')
      notify(`"${tt.name}" deleted`, 'success')
    } catch (e: unknown) { notify((e as Error).message, 'error') }
  }

  const openManage = async (tt: TestType) => {
    const ids = await window.api.testTypes.getTestCaseIds(tt.id)
    setManagedIds(new Set(ids))
    setManaging(tt)
  }

  const handleToggleCase = async (caseId: number) => {
    if (!managing) return
    const next = new Set(managedIds)
    if (next.has(caseId)) {
      await window.api.testTypes.removeTestCase(managing.id, caseId)
      next.delete(caseId)
    } else {
      await window.api.testTypes.addTestCase(managing.id, caseId)
      next.add(caseId)
    }
    setManagedIds(next)
    invalidate('testTypes')
  }

  const handleBatchAdd = async (ids: number[]) => {
    if (!managing || ids.length === 0) return
    await Promise.all(ids.map(id => window.api.testTypes.addTestCase(managing.id, id)))
    setManagedIds(prev => { const next = new Set(prev); ids.forEach(id => next.add(id)); return next })
    invalidate('testTypes')
  }

  const handleBatchRemove = async (ids: number[]) => {
    if (!managing || ids.length === 0) return
    await Promise.all(ids.map(id => window.api.testTypes.removeTestCase(managing.id, id)))
    setManagedIds(prev => { const next = new Set(prev); ids.forEach(id => next.delete(id)); return next })
    invalidate('testTypes')
  }

  const handleExport = async (ids: number[]) => {
    if (!selectedProject) return
    try {
      const result = await window.api.testTypes.exportTypes(selectedProject.id, ids) as { count: number; path: string }
      notify(`Exported ${result.count} test type(s)`, 'success')
      setShowExport(false)
    } catch (e: unknown) { notify((e as Error).message, 'error') }
  }

  const handleImport = async () => {
    if (!selectedProject) return
    try {
      const result = await window.api.testTypes.importTypes(selectedProject.id) as { count: number }
      invalidate('testTypes')
      notify(`Imported ${result.count} test type(s)`, 'success')
    } catch (e: unknown) { notify((e as Error).message, 'error') }
  }

  return (
    <div className="tt-page">
      <div className="tt-header">
        <h1 className="headline-sm">Test Types</h1>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleImport}>↓ Import</button>
          <button className="btn btn-secondary btn-sm" disabled={!testTypes || testTypes.length === 0} onClick={() => setShowExport(true)}>↑ Export</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ New Test Type</button>
        </div>
      </div>

      <p className="tt-desc">
        Group test cases into reusable test types (e.g. Smoke Testing, Regression Testing).
        Use them to quickly assign cases when creating a test cycle.
      </p>

      {loading && <p className="text-muted">Loading…</p>}

      {!loading && testTypes && testTypes.length === 0 && (
        <div className="tt-empty">
          <p className="tt-empty-title">No test types yet</p>
          <p className="tt-empty-desc">Create your first test type to group related test cases.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Test Type</button>
        </div>
      )}

      {testTypes && testTypes.length > 0 && (
        <div className="tt-list">
          {testTypes.map(tt => (
            <div key={tt.id} className="tt-card">
              <div className="tt-card-info">
                <span className="tt-card-name">{tt.name}</span>
                <span className="tt-card-count">{tt.test_case_count} case{tt.test_case_count !== 1 ? 's' : ''}</span>
              </div>
              <div className="tt-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openManage(tt)}>Manage Cases</button>
                <button className="btn btn-secondary btn-sm" onClick={() => setRenaming(tt)}>Rename</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tt)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showExport && testTypes && testTypes.length > 0 && (
        <ExportModal testTypes={testTypes} onExport={handleExport} onClose={() => setShowExport(false)} />
      )}
      {showCreate && <CreateModal onSave={handleCreate} onClose={() => setShowCreate(false)} />}
      {renaming && <RenameModal current={renaming.name} onSave={handleRename} onClose={() => setRenaming(null)} />}
      {managing && (
        <ManageCasesModal
          testType={managing}
          selectedIds={managedIds}
          categories={categories || []}
          subcategories={subcategories || []}
          onToggle={handleToggleCase}
          onBatchAdd={handleBatchAdd}
          onBatchRemove={handleBatchRemove}
          onClose={() => { setManaging(null); invalidate('testTypes') }}
          projectId={selectedProject.id}
        />
      )}
    </div>
  )
}
