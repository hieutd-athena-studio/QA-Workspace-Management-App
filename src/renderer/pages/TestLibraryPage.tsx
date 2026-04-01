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
    </div>
  )
}
