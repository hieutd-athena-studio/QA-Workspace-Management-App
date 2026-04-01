import React, { useState } from 'react'
import type { Category, Subcategory, CreateCategoryDTO, CreateSubcategoryDTO } from '@shared/types'
import { useApi } from '../../hooks/useApi'
import { useInvalidation } from '../../contexts/InvalidationContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useProject } from '../../contexts/ProjectContext'
import ConfirmDialog from '../shared/ConfirmDialog'
import './CategoryPanel.css'

interface Props {
  selectedSubcategory: Subcategory | null
  onSelectSubcategory: (sub: Subcategory | null) => void
}

export default function CategoryPanel({ selectedSubcategory, onSelectSubcategory }: Props) {
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const { selectedProject } = useProject()

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [creatingSubIn, setCreatingSubIn] = useState<number | null>(null)
  const [newName, setNewName] = useState('')
  const [renamingCategoryId, setRenamingCategoryId] = useState<number | null>(null)
  const [renamingSubId, setRenamingSubId] = useState<number | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null)

  const { data: categories } = useApi<Category[]>(
    () => selectedProject
      ? window.api.categories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'categories'
  )

  const { data: subcategories } = useApi<Subcategory[]>(
    () => selectedProject
      ? window.api.subcategories.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'subcategories'
  )

  const subsForCategory = (categoryId: number) =>
    (subcategories || []).filter((s) => s.category_id === categoryId)

  const toggleExpand = (id: number) => {
    const next = new Set(expandedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setExpandedIds(next)
  }

  const handleCreateCategory = async () => {
    if (!newName.trim() || !selectedProject) return
    try {
      const dto: CreateCategoryDTO = { name: newName.trim(), project_id: selectedProject.id }
      await window.api.categories.create(dto)
      invalidate('categories')
      notify('Category created', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setNewName('')
    setCreatingCategory(false)
  }

  const handleRenameCategory = async (id: number) => {
    if (!renameName.trim()) { setRenamingCategoryId(null); return }
    try {
      await window.api.categories.rename(id, renameName.trim())
      invalidate('categories')
      notify('Category renamed', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setRenamingCategoryId(null)
  }

  const handleDeleteCategory = async (cat: Category) => {
    try {
      await window.api.categories.delete(cat.id)
      invalidate('categories')
      invalidate('subcategories')
      invalidate('testCases')
      if (selectedSubcategory && subsForCategory(cat.id).some((s) => s.id === selectedSubcategory.id)) {
        onSelectSubcategory(null)
      }
      notify('Category deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeletingCategory(null)
  }

  const handleCreateSub = async (categoryId: number) => {
    if (!newName.trim() || !selectedProject) return
    try {
      const dto: CreateSubcategoryDTO = {
        name: newName.trim(),
        category_id: categoryId,
        project_id: selectedProject.id
      }
      const created = await window.api.subcategories.create(dto)
      invalidate('subcategories')
      onSelectSubcategory(created)
      notify('Sub-category created', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setNewName('')
    setCreatingSubIn(null)
  }

  const handleRenameSub = async (id: number) => {
    if (!renameName.trim()) { setRenamingSubId(null); return }
    try {
      await window.api.subcategories.rename(id, renameName.trim())
      invalidate('subcategories')
      notify('Sub-category renamed', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setRenamingSubId(null)
  }

  const handleDeleteSub = async (sub: Subcategory) => {
    try {
      await window.api.subcategories.delete(sub.id)
      invalidate('subcategories')
      invalidate('testCases')
      if (selectedSubcategory?.id === sub.id) onSelectSubcategory(null)
      notify('Sub-category deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setDeletingSub(null)
  }

  return (
    <div className="category-panel">
      <div className="category-panel-header">
        <span className="category-panel-label">Categories</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setCreatingCategory(true); setNewName('') }}
          disabled={!selectedProject}
        >+ New</button>
      </div>

      {creatingCategory && (
        <div className="category-create-input">
          <input
            className="input"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCategory()
              if (e.key === 'Escape') setCreatingCategory(false)
            }}
            onBlur={() => { if (newName.trim()) handleCreateCategory(); else setCreatingCategory(false) }}
            placeholder="Category name..."
            autoFocus
          />
        </div>
      )}

      {(categories || []).length === 0 && !creatingCategory && (
        <div className="category-panel-empty">
          No categories yet.<br />Click <strong>+ New</strong> to create one.
        </div>
      )}

      {(categories || []).map((cat) => {
        const isExpanded = expandedIds.has(cat.id)
        const subs = subsForCategory(cat.id)

        return (
          <React.Fragment key={cat.id}>
            <div className="category-row">
              <span className="category-chevron" onClick={() => toggleExpand(cat.id)}>
                {isExpanded ? '▾' : '▸'}
              </span>

              {renamingCategoryId === cat.id ? (
                <input
                  className="input category-rename-input"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameCategory(cat.id)
                    if (e.key === 'Escape') setRenamingCategoryId(null)
                  }}
                  onBlur={() => handleRenameCategory(cat.id)}
                  autoFocus
                />
              ) : (
                <span
                  className="category-name"
                  onClick={() => toggleExpand(cat.id)}
                  onDoubleClick={() => { setRenamingCategoryId(cat.id); setRenameName(cat.name) }}
                >
                  {cat.name}
                </span>
              )}

              <span className="category-actions">
                <button
                  className="category-action-btn"
                  title="New sub-category"
                  onClick={() => {
                    setCreatingSubIn(cat.id)
                    setNewName('')
                    if (!isExpanded) toggleExpand(cat.id)
                  }}
                >+</button>
                <button
                  className="category-action-btn danger"
                  title="Delete category"
                  onClick={() => setDeletingCategory(cat)}
                >×</button>
              </span>
            </div>

            {isExpanded && (
              <>
                {subs.map((sub) => (
                  <div
                    key={sub.id}
                    className={`subcategory-row ${selectedSubcategory?.id === sub.id ? 'subcategory-row-selected' : ''}`}
                    onClick={() => onSelectSubcategory(sub)}
                  >
                    {renamingSubId === sub.id ? (
                      <input
                        className="input subcategory-rename-input"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSub(sub.id)
                          if (e.key === 'Escape') setRenamingSubId(null)
                        }}
                        onBlur={() => handleRenameSub(sub.id)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="subcategory-name"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          setRenamingSubId(sub.id)
                          setRenameName(sub.name)
                        }}
                      >
                        {sub.name}
                      </span>
                    )}
                    <span className="subcategory-actions">
                      <button
                        className="category-action-btn danger"
                        title="Delete sub-category"
                        onClick={(e) => { e.stopPropagation(); setDeletingSub(sub) }}
                      >×</button>
                    </span>
                  </div>
                ))}

                {creatingSubIn === cat.id && (
                  <div className="subcategory-create-input">
                    <input
                      className="input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateSub(cat.id)
                        if (e.key === 'Escape') setCreatingSubIn(null)
                      }}
                      onBlur={() => { if (newName.trim()) handleCreateSub(cat.id); else setCreatingSubIn(null) }}
                      placeholder="Sub-category name..."
                      autoFocus
                    />
                  </div>
                )}
              </>
            )}
          </React.Fragment>
        )
      })}

      {deletingCategory && (
        <ConfirmDialog
          title="Delete Category"
          message={`Delete "${deletingCategory.name}" and all its sub-categories and test cases? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteCategory(deletingCategory)}
          onCancel={() => setDeletingCategory(null)}
        />
      )}

      {deletingSub && (
        <ConfirmDialog
          title="Delete Sub-category"
          message={`Delete "${deletingSub.name}" and all its test cases? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => handleDeleteSub(deletingSub)}
          onCancel={() => setDeletingSub(null)}
        />
      )}
    </div>
  )
}
