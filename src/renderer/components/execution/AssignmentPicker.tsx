import React, { useState } from 'react'
import type { Folder, TestCase, TestCaseAssignment } from '@shared/types'
import { useApi } from '../../hooks/useApi'
import './AssignmentPicker.css'

interface Props {
  cycleId: number
  existingAssignments: TestCaseAssignment[]
  onAssign: (testCaseIds: number[]) => void
  onClose: () => void
}

export default function AssignmentPicker({ cycleId, existingAssignments, onAssign, onClose }: Props) {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const assignedIds = new Set(existingAssignments.map((a) => a.test_case_id))

  const { data: folders } = useApi<Folder[]>(() => window.api.folders.getAll(), [], 'folders')
  const { data: testCases } = useApi<TestCase[]>(
    () => selectedFolder ? window.api.testCases.getByFolder(selectedFolder.id) : Promise.resolve([]),
    [selectedFolder?.id]
  )

  const rootFolders = (folders || []).filter((f) => f.parent_id === null)

  const toggleCase = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
  }

  const handleAssign = () => {
    onAssign(Array.from(selected))
  }

  const renderFolderList = (parentId: number | null, depth: number): React.ReactNode => {
    const children = (folders || []).filter((f) => f.parent_id === parentId)
    return children.map((f) => (
      <React.Fragment key={f.id}>
        <div
          className={`picker-folder ${selectedFolder?.id === f.id ? 'picker-folder-active' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => setSelectedFolder(f)}
        >
          {f.name}
        </div>
        {renderFolderList(f.id, depth + 1)}
      </React.Fragment>
    ))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Assign Test Cases</h2>
        </div>

        <div className="picker-layout">
          <div className="picker-folders">
            <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>Folders</div>
            {rootFolders.length === 0 ? (
              <div className="body-sm text-muted">No folders</div>
            ) : (
              renderFolderList(null, 0)
            )}
          </div>

          <div className="picker-cases">
            <div className="label-md text-muted" style={{ marginBottom: 'var(--sp-2)' }}>
              Test Cases {selectedFolder ? `in ${selectedFolder.name}` : ''}
            </div>
            {!selectedFolder ? (
              <div className="body-sm text-muted">Select a folder</div>
            ) : !testCases?.length ? (
              <div className="body-sm text-muted">No test cases in this folder</div>
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
          <button className="btn btn-primary" onClick={handleAssign} disabled={selected.size === 0}>
            Assign Selected
          </button>
        </div>
      </div>
    </div>
  )
}
