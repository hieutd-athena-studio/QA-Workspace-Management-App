import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useProject } from '../../contexts/ProjectContext'
import './Sidebar.css'

/* --- Inline SVG Icons --- */
const IconGrid = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1"/>
    <rect x="9" y="1.5" width="4.5" height="4.5" rx="1"/>
    <rect x="1.5" y="9" width="4.5" height="4.5" rx="1"/>
    <rect x="9" y="9" width="4.5" height="4.5" rx="1"/>
  </svg>
)

const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <path d="M3 4.5h9M3 7.5h9M3 10.5h6"/>
  </svg>
)

const IconClipboard = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="3" width="10" height="10.5" rx="1.5"/>
    <path d="M5.5 3V2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1"/>
    <path d="M5 8h5M5 10.5h3"/>
  </svg>
)

const IconReport = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12 L5.5 8 L8.5 9.5 L12.5 4"/>
    <circle cx="5.5" cy="8" r="1.25" fill="currentColor" stroke="none" opacity="0.7"/>
    <circle cx="8.5" cy="9.5" r="1.25" fill="currentColor" stroke="none" opacity="0.7"/>
    <circle cx="12.5" cy="4" r="1.25" fill="currentColor" stroke="none" opacity="0.7"/>
  </svg>
)

const IconTag = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 2h5l6 6-5 5-6-6V2z"/>
    <circle cx="5" cy="5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="7.5" r="5.5"/>
    <path d="M7.5 7.5L10.5 4.5"/>
    <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
)

/* --- Nav Items Config --- */
const globalNavItems = [
  { to: '/dashboard', Icon: IconDashboard, label: 'Dashboard' },
]

const workspaceNavItems = [
  { to: '/library',    Icon: IconList,      label: 'Test Library' },
  { to: '/test-types', Icon: IconTag,       label: 'Test Types' },
  { to: '/plans',      Icon: IconClipboard, label: 'Test Plans' },
  { to: '/reports',    Icon: IconReport,    label: 'Reports' },
]

export default function Sidebar() {
  const { selectedProject } = useProject()
  const navigate = useNavigate()

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">QA</span>
        <span className="sidebar-brand-text">Workspace</span>
      </div>

      {/* Global nav */}
      <nav className="sidebar-nav">
        <NavLink
          to="/projects"
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
        >
          <span className="sidebar-link-icon"><IconGrid /></span>
          <span className="sidebar-link-label">Projects</span>
        </NavLink>
        {globalNavItems.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <span className="sidebar-link-icon"><Icon /></span>
            <span className="sidebar-link-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Current project */}
      <div style={{ padding: '0 0 var(--sp-3)' }}>
        <div className="sidebar-section-label" style={{ paddingTop: 'var(--sp-4)' }}>
          Current Project
        </div>

        {selectedProject ? (
          <div className="sidebar-project-block">
            <div className="sidebar-project-chip">
              <span className="sidebar-project-code">{selectedProject.code}</span>
              <span className="sidebar-project-name">{selectedProject.name}</span>
            </div>
            <button className="sidebar-switch-btn" onClick={() => navigate('/projects')}>
              Switch project
            </button>
          </div>
        ) : (
          <div className="sidebar-project-block sidebar-project-empty">
            <span className="sidebar-project-none">No project selected</span>
            <button className="sidebar-switch-btn" onClick={() => navigate('/projects')}>
              Select project →
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-divider" />

      {/* Workspace nav — only when project selected */}
      {selectedProject && (
        <nav className="sidebar-nav">
          {workspaceNavItems.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <span className="sidebar-link-icon"><Icon /></span>
              <span className="sidebar-link-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      <div className="sidebar-spacer" />
    </aside>
  )
}
