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
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <span
          className="folder-chevron"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
        >
          {hasChildren || creatingIn === folder.id ? (expanded ? '▾' : '▸') : '\u00A0\u00A0'}
        </span>

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
            className="folder-name truncate"
            onClick={() => onSelect(folder)}
            onDoubleClick={() => { setRenaming(true); setRenameName(folder.name) }}
          >
            {folder.name}
          </span>
        )}

        <span className="folder-actions">
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={(e) => { e.stopPropagation(); onCreateChild(folder.id); setExpanded(true) }}
            title="New subfolder"
          >+</button>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true) }}
            title="Delete folder"
          >&times;</button>
        </span>
      </div>

      {expanded && (
        <>
          {creatingIn === folder.id && (
            <div className="folder-create-input" style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}>
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
