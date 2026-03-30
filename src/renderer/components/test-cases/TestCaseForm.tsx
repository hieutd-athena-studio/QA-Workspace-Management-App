import React, { useState } from 'react'
import type { TestCase, TestStep, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import './TestCaseForm.css'

interface Props {
  folderId: number
  testCase: TestCase | null
  onSave: (dto: CreateTestCaseDTO | UpdateTestCaseDTO) => void
  onCancel: () => void
}

export default function TestCaseForm({ folderId, testCase, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(testCase?.title || '')
  const [description, setDescription] = useState(testCase?.description || '')
  const [expectedResult, setExpectedResult] = useState(testCase?.expected_result || '')
  const [steps, setSteps] = useState<TestStep[]>(
    testCase?.steps?.length
      ? testCase.steps
      : [{ step: 1, action: '', expected: '' }]
  )

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, action: '', expected: '' }])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 })))
  }

  const updateStep = (index: number, field: 'action' | 'expected', value: string) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleSubmit = () => {
    if (!title.trim()) return
    const dto = {
      title: title.trim(),
      description: description.trim(),
      steps: steps.filter((s) => s.action.trim()),
      expected_result: expectedResult.trim(),
      folder_id: folderId
    }
    onSave(dto)
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content modal-content-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{testCase ? 'Edit Test Case' : 'New Test Case'}</h2>
        </div>

        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Login with valid credentials"
            autoFocus
          />
        </div>

        <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
          <label className="form-label">Description</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this test case verifies..."
            rows={2}
          />
        </div>

        <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
          <label className="form-label">Steps</label>
          <div className="steps-table">
            <div className="steps-header">
              <span className="steps-col-num">#</span>
              <span className="steps-col-action">Action</span>
              <span className="steps-col-expected">Expected Result</span>
              <span className="steps-col-del"></span>
            </div>
            {steps.map((step, i) => (
              <div key={i} className="steps-row">
                <span className="steps-col-num mono">{step.step}</span>
                <input
                  className="input steps-input"
                  value={step.action}
                  onChange={(e) => updateStep(i, 'action', e.target.value)}
                  placeholder="Action..."
                />
                <input
                  className="input steps-input"
                  value={step.expected}
                  onChange={(e) => updateStep(i, 'expected', e.target.value)}
                  placeholder="Expected..."
                />
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => removeStep(i)}
                  disabled={steps.length <= 1}
                >&times;</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={addStep} style={{ marginTop: 'var(--sp-2)' }}>
              + Add Step
            </button>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: 'var(--sp-4)' }}>
          <label className="form-label">Overall Expected Result</label>
          <textarea
            className="textarea"
            value={expectedResult}
            onChange={(e) => setExpectedResult(e.target.value)}
            placeholder="The overall expected outcome..."
            rows={2}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!title.trim()}>
            {testCase ? 'Save Changes' : 'Create Test Case'}
          </button>
        </div>
      </div>
    </div>
  )
}
