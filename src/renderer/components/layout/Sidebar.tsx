import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useProject } from '../../contexts/ProjectContext'
import './Sidebar.css'

const workspaceNavItems = [
  { to: '/library', icon: '&#9776;', label: 'Test Library' },
  { to: '/plans', icon: '&#9654;', label: 'Test Plans' },
  { to: '/gantt', icon: '&#9866;', label: 'Gantt Chart' },
  { to: '/reports', icon: '&#9881;', label: 'Reports' }
]

export default function Sidebar() {
  const { selectedProject, setSelectedProject } = useProject()
  const navigate = useNavigate()

  const handleSwitchProject = () => {
    navigate('/projects')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">QA</span>
        <span className="sidebar-brand-text">Workspace</span>
      </div>

      {/* Projects nav item */}
      <nav className="sidebar-nav">
        <NavLink
          to="/projects"
          className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
        >
          <span className="sidebar-link-icon">&#9632;</span>
          <span className="sidebar-link-label">Projects</span>
        </NavLink>
      </nav>

      {/* Selected project chip */}
      {selectedProject ? (
        <div className="sidebar-project-block">
          <div className="sidebar-project-label">Current Project</div>
          <div className="sidebar-project-chip">
            <span className="sidebar-project-code">{selectedProject.code}</span>
            <span className="sidebar-project-name">{selectedProject.name}</span>
          </div>
          <button className="sidebar-switch-btn" onClick={handleSwitchProject}>
            Switch project
          </button>
        </div>
      ) : (
        <div className="sidebar-project-block sidebar-project-empty">
          <span className="sidebar-project-none">No project selected</span>
          <button className="sidebar-switch-btn" onClick={handleSwitchProject}>
            Select project
          </button>
        </div>
      )}

      <div className="sidebar-divider" />

      {/* Workspace nav — only shown when a project is selected */}
      {selectedProject && (
        <nav className="sidebar-nav">
          {workspaceNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
            >
              <span className="sidebar-link-icon" dangerouslySetInnerHTML={{ __html: item.icon }} />
              <span className="sidebar-link-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </aside>
  )
}
