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
      <svg className="tcl-empty-illustration" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="38" width="112" height="76" rx="7" fill="#e8edf5"/>
        <rect x="24" y="38" width="112" height="22" rx="7" fill="#c8d4e8"/>
        <rect x="24" y="52" width="112" height="8" rx="0" fill="#c8d4e8"/>
        <rect x="36" y="44" width="40" height="5" rx="2.5" fill="#98afc8"/>
        <circle cx="124" cy="47" r="6" fill="#98afc8" opacity="0.45"/>
        <rect x="36" y="74" width="88" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="36" y="88" width="64" height="5" rx="2.5" fill="#d0daea"/>
        <rect x="36" y="102" width="76" height="5" rx="2.5" fill="#d0daea"/>
      </svg>
      <p className="tcl-empty-title">Select a folder</p>
      <p className="tcl-empty-desc">Choose a folder from the left panel to view and manage its test cases.</p>
    </div>
  )
}

function NoTestCasesState({ folderName, onNewCase }: { folderName: string; onNewCase: () => void }) {
  return (
    <div className="tcl-empty-state">
      <svg className="tcl-empty-illustration" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="22" y="26" width="76" height="88" rx="6" fill="#e8edf5"/>
        <rect x="22" y="26" width="76" height="20" rx="6" fill="#c8d4e8"/>
        <rect x="22" y="38" width="76" height="8" rx="0" fill="#c8d4e8"/>
        <path d="M34 35 h28" stroke="#98afc8" strokeWidth="3" strokeLinecap="round"/>
        <rect x="34" y="58" width="52" height="4" rx="2" fill="#d0daea"/>
        <rect x="34" y="70" width="38" height="4" rx="2" fill="#d0daea"/>
        <rect x="34" y="82" width="46" height="4" rx="2" fill="#d0daea"/>
        <rect x="34" y="94" width="30" height="4" rx="2" fill="#d0daea"/>
        <circle cx="118" cy="92" r="24" fill="#f0f4fc"/>
        <circle cx="116" cy="90" r="13" fill="none" stroke="#a0b4d0" strokeWidth="2.5"/>
        <line x1="125" y1="99" x2="136" y2="110" stroke="#a0b4d0" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <p className="tcl-empty-title">No test cases</p>
      <p className="tcl-empty-desc">
        No test cases in &ldquo;{folderName}&rdquo; yet. Create your first one to get started.
      </p>
      <button className="btn btn-primary btn-sm" onClick={onNewCase}>+ New Test Case</button>
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
            <span className="tcl-count">
              {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onNewCase}>+ New Test Case</button>
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
              <th style={{ width: 110 }}>ID</th>
              <th>Title</th>
              <th style={{ width: 80 }}>Steps</th>
              <th style={{ width: 100 }}>Created</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {testCases.map((tc) => (
              <tr key={tc.id} className="cursor-pointer" onClick={() => onEditCase(tc)}>
                <td>
                  <span className="tcl-id">{tc.display_id || '—'}</span>
                </td>
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
