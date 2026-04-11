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
  const [showCsvHelp, setShowCsvHelp] = useState(false)
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()

  const handleCopyHeader = () => {
    const headerText = 'Category,Sub-category,Title,Description,Steps,Expected Result'
    navigator.clipboard.writeText(headerText).then(() => {
      notify('Header row copied to clipboard', 'success')
    }).catch(() => {
      notify('Failed to copy', 'error')
    })
  }

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

  const handleImportCSV = async () => {
    try {
      const result = await window.api.testCases.importCSV(selectedProject!.id)
      invalidate('testCases')
      invalidate('categories')
      invalidate('subcategories')
      notify(`Imported ${result.count} test case(s)`, 'success')
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (!msg.includes('cancelled')) notify(msg, 'error')
    }
  }

  const handleExportCSV = async () => {
    try {
      const result = await window.api.testCases.exportCSV(selectedProject!.id)
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
          <button className="btn btn-secondary btn-sm" onClick={handleImportCSV}>Import CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>Export CSV</button>
          <button className="csv-help-btn" onClick={() => setShowCsvHelp(true)} title="CSV format guide">?</button>
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

      {showCsvHelp && (
        <div className="tcf-overlay" onClick={() => setShowCsvHelp(false)}>
          <div className="tcf-modal csv-help-modal" onClick={(e) => e.stopPropagation()}>
            <div className="tcf-header">
              <span className="tcf-title">CSV Import Format</span>
              <button className="tcf-close" onClick={() => setShowCsvHelp(false)}>✕</button>
            </div>
            <div className="csv-help-body">
              <p className="csv-help-intro">
                Your CSV file must include a header row with these exact column names:
              </p>
              <div className="csv-help-code-wrapper">
                <div className="csv-help-code">
                  Category,Sub-category,Title,Description,Steps,Expected Result
                  <button className="csv-copy-icon-btn" onClick={handleCopyHeader} title="Copy header row">⧉</button>
                </div>
              </div>

              <table className="csv-help-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Required</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="mono">Category</td>
                    <td className="csv-help-req">Yes</td>
                    <td>Main category name. Auto-created if it doesn't exist.</td>
                  </tr>
                  <tr>
                    <td className="mono">Sub-category</td>
                    <td className="csv-help-req">Yes</td>
                    <td>Subcategory name. Auto-created under the Category if it doesn't exist.</td>
                  </tr>
                  <tr>
                    <td className="mono">Title</td>
                    <td className="csv-help-req">Yes</td>
                    <td>Short name for the test case.</td>
                  </tr>
                  <tr>
                    <td className="mono">Description</td>
                    <td>No</td>
                    <td>Detailed description of what is being tested.</td>
                  </tr>
                  <tr>
                    <td className="mono">Steps</td>
                    <td>No</td>
                    <td>Test steps separated by semicolons or pipes. Add per-step expected results using <span className="mono">-&gt;</span> syntax: <span className="mono">action -&gt; expected result</span></td>
                  </tr>
                  <tr>
                    <td className="mono">Expected Result</td>
                    <td>No</td>
                    <td>Overall expected outcome of the test case (summary). Different from per-step results.</td>
                  </tr>
                </tbody>
              </table>

              <p className="csv-help-section-label">Notes</p>
              <ul className="csv-help-notes">
                <li><strong>Per-step expected results:</strong> Use <span className="mono">action -&gt; expected result</span> format in the Steps column. Example: <span className="mono">Click submit -&gt; Form saves successfully</span>. Each step's expected result will be stored separately.</li>
                <li><strong>Overall expected result:</strong> The <span className="mono">Expected Result</span> column is for the test case summary—what the user expects at the end of all steps.</li>
                <li>Fields containing commas or newlines must be wrapped in double quotes.</li>
                <li>To include a literal double quote inside a field, escape it as <span className="mono">""</span>.</li>
                <li>Existing categories and subcategories are matched by name — no duplicates are created.</li>
              </ul>

              <p className="csv-help-section-label">Example</p>
              <div className="csv-help-code csv-help-code-example">
Category,Sub-category,Title,Description,Steps,Expected Result
{`Authentication,Login,Valid login,Verify login with correct credentials,"Enter username -> Field accepts input | Enter password -> Field accepts input | Click Login -> Dashboard loads",User is authenticated`}
{`Authentication,Login,Invalid password,Verify error on wrong password,"Enter username -> Field accepts input | Enter wrong password -> Field accepts input | Click Login -> Error displayed",Proper error message shown`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
