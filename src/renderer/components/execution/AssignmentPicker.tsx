import React, { useState } from 'react'
import type { Category, Subcategory, TestCase, TestCaseAssignment } from '@shared/types'
import { useApi } from '../../hooks/useApi'
import { useProject } from '../../contexts/ProjectContext'
import './AssignmentPicker.css'

interface Props {
  cycleId: number
  existingAssignments: TestCaseAssignment[]
  onAssign: (testCaseIds: number[]) => void
  onClose: () => void
}

export default function AssignmentPicker({ cycleId, existingAssignments, onAssign, onClose }: Props) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const { selectedProject } = useProject()

  const assignedIds = new Set(existingAssignments.map((a) => a.test_case_id))

  const { data: categories } = useApi<Category[]>(
    () => selectedProject
      ? window.api.categories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'categories'
  )

  const { data: subcategories } = useApi<Subcategory[]>(
    () => selectedProject
      ? window.api.subcategories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'subcategories'
  )

  const { data: testCases } = useApi<TestCase[]>(
    () => selectedSubcategory
      ? window.api.testCases.getBySubcategory(selectedSubcategory.id)
      : Promise.resolve([]),
    [selectedSubcategory?.id]
  )

  const subsForCategory = (categoryId: number) =>
    (subcategories || []).filter((s) => s.category_id === categoryId)

  const toggleCase = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const selectAllInSubcategory = () => {
    if (!testCases) return
    const next = new Set(selected)
    const unassigned = testCases.filter(tc => !assignedIds.has(tc.id))
    const allSelected = unassigned.every(tc => next.has(tc.id))
    if (allSelected) {
      unassigned.forEach(tc => next.delete(tc.id))
    } else {
      unassigned.forEach(tc => next.add(tc.id))
    }
    setSelected(next)
  }

  const selectAllInCategory = async (categoryId: number) => {
    const subs = subsForCategory(categoryId)
    const next = new Set(selected)
    for (const sub of subs) {
      try {
        const cases = await window.api.testCases.getBySubcategory(sub.id) as TestCase[]
        cases.forEach(tc => {
          if (!assignedIds.has(tc.id)) next.add(tc.id)
        })
      } catch { /* skip errors */ }
    }
    setSelected(next)
  }

  const subcategoryUnassignedCount = testCases
    ? testCases.filter(tc => !assignedIds.has(tc.id)).length
    : 0

  const allSubcategorySelected = testCases
    ? subcategoryUnassignedCount > 0 && testCases.filter(tc => !assignedIds.has(tc.id)).every(tc => selected.has(tc.id))
    : false

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Test Cases</h2>
        </div>

        <div className="picker-layout">
          <div className="picker-folders">
            <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>Categories</div>
            {(categories || []).length === 0 ? (
              <div className="body-sm text-muted">No categories</div>
            ) : (
              (categories || []).map((cat) => (
                <React.Fragment key={cat.id}>
                  <div className="picker-category-header">
                    <span>{cat.name}</span>
                    <button
                      className="picker-select-all-btn"
                      onClick={(e) => { e.stopPropagation(); selectAllInCategory(cat.id) }}
                      title={`Select all test cases in ${cat.name}`}
                    >
                      All
                    </button>
                  </div>
                  {subsForCategory(cat.id).map((sub) => (
                    <div
                      key={sub.id}
                      className={`picker-folder picker-subfolder ${selectedSubcategory?.id === sub.id ? 'picker-folder-active' : ''}`}
                      onClick={() => setSelectedSubcategory(sub)}
                    >
                      {sub.name}
                    </div>
                  ))}
                </React.Fragment>
              ))
            )}
          </div>

          <div className="picker-cases">
            <div className="picker-cases-header">
              <span className="label-md text-muted">
                Test Cases {selectedSubcategory ? `in ${selectedSubcategory.name}` : ''}
              </span>
              {selectedSubcategory && testCases && subcategoryUnassignedCount > 0 && (
                <button
                  className="picker-select-all-btn"
                  onClick={selectAllInSubcategory}
                >
                  {allSubcategorySelected ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>
            {!selectedSubcategory ? (
              <div className="body-sm text-muted">Select a sub-category</div>
            ) : !testCases?.length ? (
              <div className="body-sm text-muted">No test cases in this sub-category</div>
            ) : (
              <div className="picker-case-list">
                {testCases.map((tc) => {
                  const isAssigned = assignedIds.has(tc.id)
                  const isSelected = selected.has(tc.id)
                  return (
                    <label
                      key={tc.id}
                      className={`picker-case-item ${isAssigned ? 'picker-case-assigned' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected || isAssigned}
                        disabled={isAssigned}
                        onChange={() => toggleCase(tc.id)}
                      />
                      <span>{tc.title}</span>
                      {isAssigned && <span className="body-sm text-muted">(assigned)</span>}
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <span className="body-sm text-muted">{selected.size} selected</span>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onAssign(Array.from(selected))} disabled={selected.size === 0}>
            Assign Selected
          </button>
        </div>
      </div>
    </div>
  )
}
