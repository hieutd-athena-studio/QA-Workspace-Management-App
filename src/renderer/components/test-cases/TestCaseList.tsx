import React, { useState } from 'react'
import type { Folder, TestCase } from '@shared/types'
import EmptyState from '../shared/EmptyState'
import ConfirmDialog from '../shared/ConfirmDialog'
import './TestCaseList.css'

interface Props {
  folder: Folder | null
  testCases: TestCase[]
  loading: boolean
  onNewCase: () => void
  onEditCase: (tc: TestCase) => void
  onDeleteCase: (id: number) => void
}

export default function TestCaseList({ folder, testCases, loading, onNewCase, onEditCase, onDeleteCase }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null)

  if (!folder) {
    return (
      <EmptyState
        icon="&#128194;"
        title="Select a folder"
        description="Choose a folder from the tree to view its test cases."
      />
    )
  }

  return (
    <div className="test-case-list">
      <div className="test-case-list-header flex items-center justify-between">
        <div>
          <h2 className="title-sm">{folder.name}</h2>
          <span className="body-sm text-muted">{testCases.length} test case{testCases.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onNewCase}>+ New Test Case</button>
      </div>

      {loading ? (
        <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>Loading...</div>
      ) : testCases.length === 0 ? (
        <EmptyState
          icon="&#128221;"
          title="No test cases"
          description={`No test cases in "${folder.name}" yet.`}
          actionLabel="Create Test Case"
          onAction={onNewCase}
        />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Steps</th>
              <th>Created</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.id} className="cursor-pointer" onClick={() => onEditCase(tc)}>
                <td>{tc.title}</td>
                <td className="secondary">{tc.steps.length} step{tc.steps.length !== 1 ? 's' : ''}</td>
                <td className="secondary">{new Date(tc.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(tc) }}
                  >&times;</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Test Case"
          message={`Delete "${deleteTarget.title}"? This will also remove it from any assigned test cycles.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDeleteCase(deleteTarget.id); setDeleteTarget(null) }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
