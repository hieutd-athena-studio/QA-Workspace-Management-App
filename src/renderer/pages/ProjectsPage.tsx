import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Project, CreateProjectDTO, UpdateProjectDTO, ProjectStatus } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useInvalidation } from '../contexts/InvalidationContext'
import { useNotification } from '../contexts/NotificationContext'
import { useProject } from '../contexts/ProjectContext'
import ConfirmDialog from '../components/shared/ConfirmDialog'
import './ProjectsPage.css'

const STATUS_COLORS: Record<ProjectStatus, string> = {
  'On-going': 'var(--success)',
  'On-hold': '#d97706',
  'Dropped': '#6b7280'
}

const EMPTY_FORM = { name: '', code: '', status: 'On-going' as ProjectStatus, description: '' }

interface ProjectFormProps {
  initial?: typeof EMPTY_FORM
  isEdit?: boolean
  onSave: (data: typeof EMPTY_FORM) => void
  onCancel: () => void
}

function ProjectForm({ initial = EMPTY_FORM, isEdit = false, onSave, onCancel }: ProjectFormProps) {
  const [form, setForm] = useState(initial)
  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name.trim() && form.code.trim().length >= 1

  return (
    <div className="tcf-overlay" onClick={onCancel}>
      <div className="tcf-modal proj-modal" onClick={e => e.stopPropagation()}>
        <h2 className="tcf-title">{isEdit ? 'Edit Project' : 'New Project'}</h2>

        <div className="proj-form-grid">
          <div className="form-group">
            <label className="tcf-label">Project Name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g., Arrow Maze Tap"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="tcf-label">
              Project Code
              <span className="proj-code-hint">(2–3 letters, e.g. ARR)</span>
            </label>
            <input
              className="input proj-code-input"
              value={form.code}
              onChange={e => set('code', e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
              placeholder="ARR"
              maxLength={3}
              style={{ textTransform: 'uppercase', letterSpacing: '0.1em', maxWidth: 120 }}
            />
          </div>

          <div className="form-group">
            <label className="tcf-label">Status</label>
            <select
              className="select"
              value={form.status}
              onChange={e => set('status', e.target.value as ProjectStatus)}
            >
              <option value="On-going">On-going</option>
              <option value="On-hold">On-hold</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="tcf-label">Description</label>
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief description of the project…"
              style={{ resize: 'vertical', minHeight: 72 }}
            />
          </div>
        </div>

        <div className="tcf-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave(form)}
            disabled={!valid}
          >
            {isEdit ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const { selectedProject, setSelectedProject } = useProject()

  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Project | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)

  const { data: projects, loading } = useApi<Project[]>(
    () => window.api.projects.getAll(),
    [],
    'projects'
  )

  const handleCreate = async (form: typeof EMPTY_FORM) => {
    try {
      const dto: CreateProjectDTO = { ...form }
      const created = await window.api.projects.create(dto)
      invalidate('projects')
      notify(`Project "${created.name}" created`, 'success')
      setShowCreate(false)
      setSelectedProject(created)
      navigate('/library')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleEdit = async (form: typeof EMPTY_FORM) => {
    if (!editTarget) return
    try {
      const dto: UpdateProjectDTO = { ...form }
      const updated = await window.api.projects.update(editTarget.id, dto)
      invalidate('projects')
      notify('Project updated', 'success')
      if (selectedProject?.id === editTarget.id) setSelectedProject(updated)
      setEditTarget(null)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await window.api.projects.delete(id)
      invalidate('projects')
      invalidate('folders')
      invalidate('testCases')
      invalidate('testPlans')
      notify('Project deleted', 'success')
      if (selectedProject?.id === id) setSelectedProject(null)
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeleteTarget(null)
  }

  const handleSelect = (project: Project) => {
    setSelectedProject(project)
    navigate('/library')
  }

  return (
    <div className="projects-page">
      <div className="projects-page-header">
        <div>
          <h1>Projects</h1>
          <p className="projects-page-sub">Select a project to enter its workspace, or manage your projects here.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Project</button>
      </div>

      {loading ? (
        <div className="text-muted body-sm" style={{ padding: 'var(--sp-8)', textAlign: 'center' }}>Loading…</div>
      ) : !projects?.length ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" width="80" height="80">
              <rect x="8" y="16" width="64" height="48" rx="8" fill="#e8edf5"/>
              <rect x="8" y="16" width="64" height="16" rx="8" fill="#c8d4e8"/>
              <rect x="8" y="24" width="64" height="8" rx="0" fill="#c8d4e8"/>
              <rect x="20" y="20" width="24" height="6" rx="3" fill="#98afc8"/>
              <rect x="20" y="40" width="40" height="5" rx="2.5" fill="#d0daea"/>
              <rect x="20" y="50" width="28" height="5" rx="2.5" fill="#d0daea"/>
            </svg>
          </div>
          <p className="projects-empty-title">No projects yet</p>
          <p className="projects-empty-desc">Create your first project to start managing test cases, plans, and cycles.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => {
            const isActive = selectedProject?.id === project.id
            return (
              <div
                key={project.id}
                className={`project-card ${isActive ? 'project-card-active' : ''}`}
                onClick={() => handleSelect(project)}
              >
                <div className="project-card-top">
                  <div className="project-card-code">{project.code}</div>
                  <span
                    className="project-status-badge"
                    style={{ color: STATUS_COLORS[project.status] }}
                  >
                    {project.status}
                  </span>
                </div>

                <div className="project-card-name">{project.name}</div>

                {project.description && (
                  <p className="project-card-desc">{project.description}</p>
                )}

                <div className="project-card-footer">
                  {isActive && (
                    <span className="project-card-active-label">Current workspace</span>
                  )}
                  <div className="project-card-actions">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={e => {
                        e.stopPropagation()
                        setEditTarget(project)
                      }}
                      title="Edit project"
                    >Edit</button>
                    <button
                      className="btn btn-ghost btn-sm proj-delete-btn"
                      onClick={e => {
                        e.stopPropagation()
                        setDeleteTarget(project)
                      }}
                      title="Delete project"
                    >×</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <ProjectForm
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {editTarget && (
        <ProjectForm
          isEdit
          initial={{
            name: editTarget.name,
            code: editTarget.code,
            status: editTarget.status,
            description: editTarget.description
          }}
          onSave={handleEdit}
          onCancel={() => setEditTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Project"
          message={`Delete "${deleteTarget.name}"? All folders, test cases, plans, and cycles in this project will be permanently removed.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
