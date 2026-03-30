import React, { useState } from 'react'
import FolderTree from '../components/folder-tree/FolderTree'
import TestCaseList from '../components/test-cases/TestCaseList'
import TestCaseForm from '../components/test-cases/TestCaseForm'
import type { Folder, TestCase, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import './TestLibraryPage.css'

export default function TestLibraryPage() {
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [editingCase, setEditingCase] = useState<TestCase | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()

  const { data: testCases, loading } = useApi<TestCase[]>(
    () => selectedFolder ? window.api.testCases.getByFolder(selectedFolder.id) : Promise.resolve([]),
    [selectedFolder?.id],
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

  return (
    <div className="library-page">
      <div className="library-header">
        <h1 className="headline-sm">Test Library</h1>
      </div>
      <div className="library-content">
        <div className="library-tree-panel">
          <FolderTree
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
          />
        </div>
        <div className="library-cases-panel">
          <TestCaseList
            folder={selectedFolder}
            testCases={testCases || []}
            loading={loading}
            onNewCase={() => { setEditingCase(null); setShowForm(true) }}
            onEditCase={(tc) => { setEditingCase(tc); setShowForm(true) }}
            onDeleteCase={handleDeleteCase}
          />
        </div>
      </div>

      {showForm && selectedFolder && (
        <TestCaseForm
          folderId={selectedFolder.id}
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
