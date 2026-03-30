import React, { useState } from 'react'
import type { Folder, CreateFolderDTO } from '@shared/types'
import { useApi } from '../../hooks/useApi'
import { useInvalidation } from '../../contexts/InvalidationContext'
import { useNotification } from '../../contexts/NotificationContext'
import FolderNode from './FolderNode'
import './FolderTree.css'

interface Props {
  selectedFolder: Folder | null
  onSelectFolder: (folder: Folder) => void
  onNewCase?: () => void
}

export default function FolderTree({ selectedFolder, onSelectFolder }: Props) {
  const { invalidate } = useInvalidation()
  const { notify } = useNotification()
  const [creatingIn, setCreatingIn] = useState<number | null | 'root'>(null)
  const [newFolderName, setNewFolderName] = useState('')

  const { data: folders } = useApi<Folder[]>(
    () => window.api.folders.getAll(),
    [],
    'folders'
  )

  const rootFolders = (folders || []).filter((f) => f.parent_id === null)

  const handleCreate = async (parentId: number | null) => {
    if (!newFolderName.trim()) return
    try {
      const dto: CreateFolderDTO = { name: newFolderName.trim(), parent_id: parentId }
      const created = await window.api.folders.create(dto)
      invalidate('folders')
      onSelectFolder(created)
      notify('Folder created', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
    setNewFolderName('')
    setCreatingIn(null)
  }

  const handleRename = async (id: number, name: string) => {
    try {
      await window.api.folders.rename(id, name)
      invalidate('folders')
      notify('Folder renamed', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await window.api.folders.delete(id)
      invalidate('folders')
      invalidate('testCases')
      notify('Folder deleted', 'success')
    } catch (e: unknown) {
      notify((e as Error).message, 'error')
    }
  }

  return (
    <div className="folder-tree">
      <div className="folder-tree-header">
        <span className="folder-tree-header-label">Folders</span>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => { setCreatingIn('root'); setNewFolderName('') }}
          title="New folder"
        >+ New</button>
      </div>

      {creatingIn === 'root' && (
        <div className="folder-create-input">
          <input
            className="input"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate(null)
              if (e.key === 'Escape') setCreatingIn(null)
            }}
            onBlur={() => { if (newFolderName.trim()) handleCreate(null); else setCreatingIn(null) }}
            placeholder="Folder name..."
            autoFocus
          />
        </div>
      )}

      {rootFolders.length === 0 && creatingIn !== 'root' && (
        <div className="folder-tree-empty">
          No folders yet.<br />Click <strong>+ New</strong> to create one.
        </div>
      )}

      {rootFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          allFolders={folders || []}
          selectedId={selectedFolder?.id ?? null}
          onSelect={onSelectFolder}
          onRename={handleRename}
          onDelete={handleDelete}
          onCreateChild={(parentId) => { setCreatingIn(parentId); setNewFolderName('') }}
          creatingIn={creatingIn}
          newFolderName={newFolderName}
          onNewFolderNameChange={setNewFolderName}
          onConfirmCreate={handleCreate}
          onCancelCreate={() => setCreatingIn(null)}
        />
      ))}
    </div>
  )
}
