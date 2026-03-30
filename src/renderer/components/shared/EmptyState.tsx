import React from 'react'

interface Props {
  icon?: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon = '&#128195;', title, description, actionLabel, onAction }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon" dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="empty-title">{title}</div>
      <div className="empty-desc">{description}</div>
      {actionLabel && onAction && (
        <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
