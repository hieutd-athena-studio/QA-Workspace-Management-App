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

  useEffect(() => {
    // Focus modal on mount for a11y
    modalRef.current?.focus()
  }, [])

  const handleAddTask = () => {
    setTasksDraft([...tasksDraft, { text: '', done: false }])
  }

  const handleDeleteTask = (index: number) => {
    setTasksDraft(tasksDraft.filter((_, i) => i !== index))
  }

  const handleTaskChange = (index: number, field: keyof Task, value: unknown) => {
    setTasksDraft(
      tasksDraft.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(tasksDraft)
    } finally {
      setSaving(false)
    }
  }

  const totalDays = getTotalTaskDays(JSON.stringify(tasksDraft))
  const budgetDays = calculateWorkingDaysBetween(plan.start_date, plan.end_date)
  const isOverBudget = totalDays > budgetDays

  return (
    <div className="task-editor-overlay" onClick={onCancel}>
      <div
        className="task-editor-modal"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="task-editor-header">
          <h2 className="task-editor-title">Edit Tasks</h2>
          <button
            className="task-editor-close"
            onClick={onCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="task-editor-content">
          {/* Budget summary */}
          <div className={`task-budget-info${isOverBudget ? ' task-budget-info--over' : ''}`}>
            <div className="task-budget-stat">
              <span className="task-budget-label">Assigned</span>
              <span className="task-budget-value">{totalDays}d</span>
            </div>
            <div className="task-budget-divider" />
            <div className="task-budget-stat">
              <span className="task-budget-label">Available</span>
              <span className="task-budget-value">{budgetDays}d</span>
            </div>
            {isOverBudget && (
              <div className="task-budget-overflow">
                <span className="task-budget-overflow-text">
                  ⚠ {totalDays - budgetDays}d over budget
                </span>
              </div>
            )}
          </div>

          {/* Task list */}
          <div className="task-editor-list">
            {tasksDraft.map((task, i) => (
              <div key={i} className="task-editor-item">
                <input
                  type="checkbox"
                  className="task-editor-checkbox"
                  checked={task.done}
                  onChange={(e) => handleTaskChange(i, 'done', e.target.checked)}
                  aria-label={`Mark "${task.text}" as done`}
                />
                <input
                  type="text"
                  className="task-editor-text"
                  value={task.text}
                  onChange={(e) => handleTaskChange(i, 'text', e.target.value)}
                  placeholder="Task description…"
                />
                <input
                  type="number"
                  className="task-editor-days"
                  min="0"
                  max="999"
                  value={task.days ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : Math.max(0, parseInt(e.target.value, 10) || 0)
                    handleTaskChange(i, 'days', val)
                  }}
                  placeholder="0"
                  title="Working days for this task"
                />
                <button
                  className="btn btn-ghost btn-sm task-editor-delete"
                  onClick={() => handleDeleteTask(i)}
                  title="Delete task"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Add task button */}
          <button
            className="btn btn-ghost btn-sm task-editor-add"
            onClick={handleAddTask}
          >
            + Add Task
          </button>
        </div>

        {/* Footer */}
        <div className="task-editor-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
