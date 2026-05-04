import React, { useState, useEffect } from 'react'
import { calculateWorkingDaysBetween, getTotalTaskDays } from '@shared/utils/working-days'
import type { TestPlan } from '@shared/types'
import './TaskEditorModal.css'

interface Task {
  text: string
  done: boolean
  days?: number
}

interface TaskEditorModalProps {
  tasks: Task[]
  plan: TestPlan
  onSave: (tasks: Task[]) => Promise<void>
  onCancel: () => void
}

export default function TaskEditorModal({ tasks, plan, onSave, onCancel }: TaskEditorModalProps) {
  const [tasksDraft, setTasksDraft] = useState<Task[]>(tasks)
  const [saving, setSaving] = useState(false)
  const modalRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => { modalRef.current?.focus() }, [])

  const handleAddTask = () => setTasksDraft([...tasksDraft, { text: '', done: false }])

  const handleDeleteTask = (index: number) => setTasksDraft(tasksDraft.filter((_, i) => i !== index))

  const handleTaskChange = (index: number, field: keyof Task, value: unknown) =>
    setTasksDraft(tasksDraft.map((t, i) => i === index ? { ...t, [field]: value } : t))

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(tasksDraft) } finally { setSaving(false) }
  }

  const totalDays = getTotalTaskDays(JSON.stringify(tasksDraft))
  const budgetDays = calculateWorkingDaysBetween(plan.start_date, plan.end_date)
  const isOverBudget = totalDays > budgetDays

  return (
    <div className="task-editor-overlay" onClick={onCancel}>
      <div
        className="task-editor-modal"
        onClick={e => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="task-editor-header">
          <h2 className="task-editor-title">Edit Tasks — {plan.name}</h2>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="task-editor-content">
          <div className={`task-budget-info${isOverBudget ? ' task-budget-info--over' : ''}`}>
            <div className="task-budget-stat">
              <span className="task-budget-label">Assigned</span>
              <span className="task-budget-value">{+totalDays.toFixed(2)}d</span>
            </div>
            <div className="task-budget-divider" />
            <div className="task-budget-stat">
              <span className="task-budget-label">Available</span>
              <span className="task-budget-value">{budgetDays}d</span>
            </div>
            {isOverBudget && (
              <div className="task-budget-overflow">
                <span className="task-budget-overflow-text">⚠ {totalDays - budgetDays}d over</span>
              </div>
            )}
          </div>

          <div>
            <div className="task-editor-section-label">Tasks</div>
            <div className="task-editor-list">
              {tasksDraft.length === 0 && (
                <div className="body-sm text-muted" style={{ padding: 'var(--sp-4) 0' }}>
                  No tasks yet — add one below.
                </div>
              )}
              {tasksDraft.map((task, i) => (
                <div key={i} className="task-editor-item">
                  <input
                    type="checkbox"
                    className="task-editor-checkbox"
                    checked={task.done}
                    onChange={e => handleTaskChange(i, 'done', e.target.checked)}
                    aria-label={`Mark task ${i + 1} as done`}
                  />
                  <input
                    type="text"
                    className="input task-editor-text"
                    value={task.text}
                    onChange={e => handleTaskChange(i, 'text', e.target.value)}
                    placeholder="Task description…"
                  />
                  <input
                    type="number"
                    className="input task-editor-days"
                    min="0"
                    max="999"
                    step="0.25"
                    value={task.days ?? ''}
                    onChange={e => {
                      const val = e.target.value === '' ? undefined : Math.max(0, parseFloat(e.target.value) || 0)
                      handleTaskChange(i, 'days', val)
                    }}
                    placeholder="0"
                    title="Working days (0.25, 0.5, 0.75, 1…)"
                  />
                  <span className="task-editor-days-label">days</span>
                  <button
                    className="btn btn-ghost btn-icon task-editor-delete"
                    onClick={() => handleDeleteTask(i)}
                    title="Delete task"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="btn task-editor-add" onClick={handleAddTask}>
            + Add Task
          </button>
        </div>

        <div className="task-editor-footer">
          <span className="task-editor-footer-meta">
            {tasksDraft.length} task{tasksDraft.length !== 1 ? 's' : ''}
          </span>
          <button className="btn btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
