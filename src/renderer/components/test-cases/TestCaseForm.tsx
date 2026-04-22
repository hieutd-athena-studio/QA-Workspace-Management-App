import React, { useState } from 'react'
import type { TestCase, TestStep, CreateTestCaseDTO, UpdateTestCaseDTO } from '@shared/types'
import './TestCaseForm.css'

interface Props {
  subcategoryId: number
  testCase: TestCase | null
  onSave: (dto: CreateTestCaseDTO | UpdateTestCaseDTO) => void
  onCancel: () => void
}

export default function TestCaseForm({ subcategoryId, testCase, onSave, onCancel }: Props) {
  const [title, setTitle] = useState(testCase?.title || '')
  const [description, setDescription] = useState(testCase?.description || '')
  const [version, setVersion] = useState(testCase?.version || '')
  const [expectedResult, setExpectedResult] = useState(testCase?.expected_result || '')
  const [steps, setSteps] = useState<TestStep[]>(
    testCase?.steps?.length
      ? testCase.steps
      : [{ step: 1, action: '', expected: '' }]
  )
  const [showPreview, setShowPreview] = useState(true)

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
      version: version.trim(),
      subcategory_id: subcategoryId
    }
    onSave(dto)
  }

  return (
    <div className="tcf-overlay" onClick={onCancel}>
      <div className="tcf-container">
        <div className="tcf-modal" onClick={(e) => e.stopPropagation()}>

          <div className="tcf-header">
          <h2 className="tcf-title">{testCase ? 'Edit Test Case' : 'New Test Case'}</h2>
          <button
            className="tcf-preview-toggle"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            {showPreview ? 'Preview' : 'Preview'}
          </button>
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Login with valid credentials"
            autoFocus
          />
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Version</label>
          <input
            className="input"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 1.0.0"
          />
        </div>

        <div className="tcf-field">
          <label className="tcf-label">Description</label>
          <textarea
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this test case verifies..."
            rows={2}
          />
        </div>

        <div className="tcf-body">
          <div className="tcf-field">
            <label className="tcf-label">Steps</label>
            <div className="tcf-steps">
              <div className="tcf-steps-head">
                <span className="tcf-col-num">#</span>
                <span className="tcf-col-action">ACTION</span>
                <span className="tcf-col-expected">EXPECTED RESULT</span>
                <span className="tcf-col-del" />
              </div>
              {steps.map((step, i) => (
                <div key={i} className="tcf-step-row">
                  <span className="tcf-col-num mono">{step.step}</span>
                  <input
                    className="input tcf-step-input"
                    value={step.action}
                    onChange={(e) => updateStep(i, 'action', e.target.value)}
                    placeholder="Action..."
                  />
                  <input
                    className="input tcf-step-input"
                    value={step.expected}
                    onChange={(e) => updateStep(i, 'expected', e.target.value)}
                    placeholder="Expected..."
                  />
                  <button
                    className="tcf-del-btn"
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                    title="Remove step"
                  >×</button>
                </div>
              ))}
              <button className="tcf-add-step" onClick={addStep}>+ Add Step</button>
            </div>
          </div>

          <div className="tcf-field">
            <label className="tcf-label">Overall Expected Result</label>
            <textarea
              className="textarea"
              value={expectedResult}
              onChange={(e) => setExpectedResult(e.target.value)}
              placeholder="The overall expected outcome..."
              rows={2}
            />
          </div>
        </div>

          <div className="tcf-footer">
            <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!title.trim()}>
              {testCase ? 'Save Changes' : 'Create Test Case'}
            </button>
          </div>
        </div>

        {showPreview && (
          <div className="tcf-preview-popup" onClick={(e) => e.stopPropagation()}>
          <h3 className="tcf-preview-title">Preview</h3>
          <div className="tcf-preview-content">
            <div className="tcf-preview-section">
              <h4 className="tcf-preview-heading">Steps</h4>
              <div className="tcf-preview-steps">
                {steps.filter(s => s.action.trim()).map((step) => (
                  <div key={step.step} className="tcf-preview-step">
                    <div className="tcf-preview-step-num">{step.step}.</div>
                    <div className="tcf-preview-step-content">
                      <div className="tcf-preview-action">{step.action || '(empty)'}</div>
                      {step.expected.trim() && (
                        <div className="tcf-preview-expected">→ {step.expected}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {expectedResult.trim() && (
              <div className="tcf-preview-section">
                <h4 className="tcf-preview-heading">Overall Expected Result</h4>
                <div className="tcf-preview-overall">{expectedResult}</div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
