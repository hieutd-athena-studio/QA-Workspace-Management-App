import React, { useState } from 'react'
import type { Folder, TestCase } from '@shared/types'
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

function NoFolderState() {
  return (
    <div className="tcl-empty-state">
      <svg className="tcl-empty-illustration" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="45" width="120" height="82" rx="8" fill="#e8edf5"/>
        <rect x="30" y="45" width="120" height="24" rx="8" fill="#c8d4e8"/>
        <rect x="30" y="57" width="120" height="12" rx="0" fill="#c8d4e8"/>
        <rect x="42" y="51" width="44" height="6" rx="3" fill="#98afc8"/>
        <circle cx="133" cy="54" r="7" fill="#98afc8" opacity="0.5"/>
        <rect x="42" y="81" width="96" height="6" rx="3" fill="#d0daea"/>
        <rect x="42" y="96" width="72" height="6" rx="3" fill="#d0daea"/>
        <rect x="42" y="111" width="84" height="6" rx="3" fill="#d0daea"/>
      </svg>
      <p className="tcl-empty-title">Select a folder</p>
      <p className="tcl-empty-desc">Choose a folder from the left panel to view and manage its test cases.</p>
    </div>
  )
}

function NoTestCasesState({ folderName, onNewCase }: { folderName: string; onNewCase: () => void }) {
  return (
    <div className="tcl-empty-state">
      <svg className="tcl-empty-illustration" viewBox="0 0 180 150" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Document stack */}
        <rect x="28" y="32" width="82" height="94" rx="7" fill="#e8edf5"/>
        <rect x="28" y="32" width="82" height="22" rx="7" fill="#c8d4e8"/>
        <rect x="28" y="46" width="82" height="8" rx="0" fill="#c8d4e8"/>
        <path d="M40 42 h30" stroke="#98afc8" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M40 53 h18" stroke="#b0c4de" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="40" y="66" width="58" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="40" y="78" width="44" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="40" y="90" width="52" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="40" y="102" width="36" height="5" rx="2.5" fill="#d0daea"/>
        {/* Magnifying glass */}
        <circle cx="128" cy="100" r="26" fill="#f0f4fc"/>
        <circle cx="128" cy="100" r="26" stroke="#c8d4e8" strokeWidth="2.5"/>
        <circle cx="126" cy="98" r="14" fill="none" stroke="#a0b4d0" strokeWidth="3"/>
        <line x1="136" y1="108" x2="148" y2="120" stroke="#a0b4d0" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
      <p className="tcl-empty-title">No test cases</p>
      <p className="tcl-empty-desc">No test cases in &ldquo;{folderName}&rdquo; yet. Create your first one to get started.</p>
      <button className="btn btn-primary" onClick={onNewCase}>+ New Test Case</button>
    </div>
  )
}

export default function TestCaseList({ folder, testCases, loading, onNewCase, onEditCase, onDeleteCase }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<TestCase | null>(null)

  if (!folder) {
    return <NoFolderState />
  }

  return (
    <div className="test-case-list">
      <div className="test-case-list-header">
        <div className="tcl-title-row">
          <div>
            <h2 className="tcl-folder-name">{folder.name}</h2>
            <span className="tcl-count">{testCases.length} test case{testCases.length !== 1 ? 's' : ''}</span>
          </div>
          <button className="btn btn-primary" onClick={onNewCase}>+ New Test Case</button>
        </div>
      </div>

      {loading ? (
        <div className="tcl-loading">Loading…</div>
      ) : testCases.length === 0 ? (
        <NoTestCasesState folderName={folder.name} onNewCase={onNewCase} />
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Steps</th>
              <th>Created</th>
              <th style={{ width: 48 }}></th>
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
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(tc) }}
                    title="Delete"
                  >×</button>
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
