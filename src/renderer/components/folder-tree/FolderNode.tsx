import React, { useState } from 'react'
import type { Folder } from '@shared/types'
import ConfirmDialog from '../shared/ConfirmDialog'

interface Props {
  folder: Folder
  allFolders: Folder[]
  selectedId: number | null
  onSelect: (folder: Folder) => void
  onRename: (id: number, name: string) => void
  onDelete: (id: number) => void
  onCreateChild: (parentId: number) => void
  creatingIn: number | null | 'root'
  newFolderName: string
  onNewFolderNameChange: (name: string) => void
  onConfirmCreate: (parentId: number | null) => void
  onCancelCreate: () => void
  depth?: number
}

export default function FolderNode({
  folder, allFolders, selectedId, onSelect, onRename, onDelete, onCreateChild,
  creatingIn, newFolderName, onNewFolderNameChange, onConfirmCreate, onCancelCreate,
  depth = 0
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [renameName, setRenameName] = useState(folder.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const children = allFolders.filter((f) => f.parent_id === folder.id)
  const hasChildren = children.length > 0
  const isSelected = selectedId === folder.id

  const handleRenameSubmit = () => {
    if (renameName.trim() && renameName.trim() !== folder.name) {
      onRename(folder.id, renameName.trim())
    }
    setRenaming(false)
  }

  return (
    <>
      <div
        className={`folder-node ${isSelected ? 'folder-node-selected' : ''}`}
        style={{ paddingLeft: `${depth * 18 + 4}px` }}
      >
        {/* Chevron */}
        <span
          className="folder-chevron"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        >
          {(hasChildren || creatingIn === folder.id)
            ? (expanded ? '▾' : '▸')
            : ''}
        </span>

        {/* Folder icon */}
        <span className="folder-icon">
          {(hasChildren || expanded) ? '📂' : '📁'}
        </span>

        {/* Name or rename input */}
        {renaming ? (
          <input
            className="input folder-rename-input"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRenameSubmit()
              if (e.key === 'Escape') setRenaming(false)
            }}
            onBlur={handleRenameSubmit}
            autoFocus
          />
        ) : (
          <span
            className="folder-name"
            onClick={() => onSelect(folder)}
            onDoubleClick={() => { setRenaming(true); setRenameName(folder.name) }}
          >
            {folder.name}
          </span>
        )}

        {/* Hover actions */}
        <span className="folder-actions">
          <button
            className="folder-action-btn"
            onClick={(e) => { e.stopPropagation(); onCreateChild(folder.id); setExpanded(true) }}
            title="New subfolder"
          >+</button>
          <button
            className="folder-action-btn danger"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            title="Delete folder"
          >×</button>
        </span>
      </div>

      {expanded && (
        <>
          {creatingIn === folder.id && (
            <div className="folder-create-input" style={{ paddingLeft: `${(depth + 1) * 18 + 4}px` }}>
              <input
                className="input"
                value={newFolderName}
                onChange={(e) => onNewFolderNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onConfirmCreate(folder.id)
                  if (e.key === 'Escape') onCancelCreate()
                }}
                onBlur={() => { if (newFolderName.trim()) onConfirmCreate(folder.id); else onCancelCreate() }}
                placeholder="Folder name..."
                autoFocus
              />
            </div>
          )}

          {children.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              allFolders={allFolders}
              selectedId={selectedId}
              onSelect={onSelect}
              onRename={onRename}
              onDelete={onDelete}
              onCreateChild={onCreateChild}
              creatingIn={creatingIn}
              newFolderName={newFolderName}
              onNewFolderNameChange={onNewFolderNameChange}
              onConfirmCreate={onConfirmCreate}
              onCancelCreate={onCancelCreate}
              depth={depth + 1}
            />
          ))}
        </>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Folder"
          message={`Delete "${folder.name}" and all its contents? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => { onDelete(folder.id); setConfirmDelete(false) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  )
}
