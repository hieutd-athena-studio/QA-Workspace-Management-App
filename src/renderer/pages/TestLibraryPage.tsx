import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CategoryPanel from '../components/category-panel/CategoryPanel'
import TestCaseList from '../components/test-cases/TestCaseList'
import TestCaseForm from '../components/test-cases/TestCaseForm'
import type { Subcategory, TestCase, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import { useProject } from '../contexts/ProjectContext'
import './TestLibraryPage.css'

export default function TestLibraryPage() {
  const navigate = useNavigate()
  const { selectedProject } = useProject()
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showJsonHelp, setShowJsonHelp] = useState(false)
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()

  const { data: testCases, loading } = useApi<TestCase[]>(
    () => selectedSubcategory
      ? window.api.testCases.getBySubcategory(selectedSubcategory.id)
      : Promise.resolve([]),
    [selectedSubcategory?.id],
    'testCases'
  )

  const handleCreateCase = async (dto: CreateTestCaseDTO) => {
    try {
      await window.api.testCases.create(dto)
      invalidate('testCases')
      notify('Test case created', 'success')
      setShowForm(false)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleUpdateCase = async (id: number, dto: UpdateTestCaseDTO) => {
    try {
      await window.api.testCases.update(id, dto)
      invalidate('testCases')
      notify('Test case updated', 'success')
      setShowForm(false)
      setEditingCase(null)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleDeleteCase = async (id: number) => {
    try {
      await window.api.testCases.delete(id)
      invalidate('testCases')
      notify('Test case deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleImportJSON = async () => {
    try {
      const result = await window.api.testCases.importJSON(selectedProject!.id)
      invalidate('testCases')
      invalidate('categories')
      invalidate('subcategories')
      notify(`Imported ${result.count} test case(s)`, 'success')
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (!msg.includes('cancelled')) notify(msg, 'error')
    }
  }

  const handleExportJSON = async () => {
    try {
      const result = await window.api.testCases.exportJSON(selectedProject!.id)
      notify(`Exported ${result.count} test case(s)`, 'success')
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (!msg.includes('cancelled')) notify(msg, 'error')
    }
  }

  if (!selectedProject) return (
    <div className="no-project-guard">
      <p className="no-project-guard-title">No project selected</p>
      <p className="no-project-guard-desc">Select a project to manage its test library.</p>
      <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
    </div>
  )

  return (
    <div className="library-page">
      <div className="library-header">
        <h1 className="headline-sm">Test Library</h1>
        <div className="library-header-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleImportJSON}>↓ Import JSON</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportJSON}>↑ Export JSON</button>
          <button className="csv-help-btn" onClick={() => setShowJsonHelp(true)} title="JSON format guide">?</button>
        </div>
      </div>
      <div className="library-content">
        <div className="library-tree-panel">
          <CategoryPanel
            selectedSubcategory={selectedSubcategory}
            onSelectSubcategory={setSelectedSubcategory}
          />
        </div>
        <div className="library-cases-panel">
          <TestCaseList
            subcategory={selectedSubcategory}
            testCases={testCases || []}
            loading={loading}
            onNewCase={() => { setEditingCase(null); setShowForm(true) }}
            onEditCase={(tc) => { setEditingCase(tc); setShowForm(true) }}
            onDeleteCase={handleDeleteCase}
          />
        </div>
      </div>

      {showForm && selectedSubcategory && (
        <TestCaseForm
          subcategoryId={selectedSubcategory.id}
          testCase={editingCase}
          onSave={(dto) =>
            editingCase
              ? handleUpdateCase(editingCase.id, dto as UpdateTestCaseDTO)
              : handleCreateCase(dto as CreateTestCaseDTO)
          }
          onCancel={() => { setShowForm(false); setEditingCase(null) }}
        />
      )}

      {showJsonHelp && (
        <div className="tcf-overlay" onClick={() => setShowJsonHelp(false)}>
          <div className="tcf-modal csv-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tcf-header">
              <span className="tcf-title">JSON Import Format</span>
              <button className="tcf-close" onClick={() => setShowJsonHelp(false)}>✕</button>
            </div>
            <div className="csv-help-body">
              <p className="csv-help-intro">
                Import file must be a valid JSON file exported from this app, or manually crafted with the structure below.
              </p>

              <table className="csv-help-table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mono">category</td>
                    <td className="csv-help-req">Yes</td>
                    <td>Main category name. Auto-created if it doesn't exist.</td>
                  </tr>
                  <tr>
                    <td className="mono">subcategory</td>
                    <td className="csv-help-req">Yes</td>
                    <td>Subcategory name. Auto-created under the category if it doesn't exist.</td>
                  </tr>
                  <tr>
                    <td className="mono">title</td>
                    <td className="csv-help-req">Yes</td>
                    <td>Short name for the test case.</td>
                  </tr>
                  <tr>
                    <td className="mono">description</td>
                    <td>No</td>
                    <td>Detailed description of what is being tested.</td>
                  </tr>
                  <tr>
                    <td className="mono">steps</td>
                    <td>No</td>
                    <td>Array of step objects: <span className="mono">{`{ "action": "...", "expected": "..." }`}</span></td>
                  </tr>
                  <tr>
                    <td className="mono">expected_result</td>
                    <td>No</td>
                    <td>Overall expected outcome (summary across all steps).</td>
                  </tr>
                  <tr>
                    <td className="mono">version</td>
                    <td>No</td>
                    <td>Version string (e.g. <span className="mono">1.0</span>). Defaults to <span className="mono">1.0</span> if omitted.</td>
                  </tr>
                </tbody>
              </table>

              <p className="csv-help-section-label">Example</p>
              <div className="csv-help-code csv-help-code-example">{`{
  "version": "1.0",
  "project_code": "ARR",
  "test_cases": [
    {
      "category": "Authentication",
      "subcategory": "Login",
      "title": "Valid login",
      "description": "Verify login with correct credentials",
      "steps": [
        { "action": "Enter username", "expected": "Field accepts input" },
        { "action": "Enter password", "expected": "Field accepts input" },
        { "action": "Click Login", "expected": "Dashboard loads" }
      ],
      "expected_result": "User is authenticated",
      "version": "1.0"
    }
  ]
}`}</div>

              <p className="csv-help-section-label">Notes</p>
              <ul className="csv-help-notes">
                <li>Existing categories and subcategories are matched by name — no duplicates are created.</li>
                <li>Export from this app always produces a valid import file.</li>
                <li><span className="mono">version</span>, <span className="mono">description</span>, and <span className="mono">expected_result</span> can be omitted or set to empty string.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
