import React from 'react'
import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const navItems = [
  { to: '/library', icon: '&#9776;', label: 'Test Library' },
  { to: '/plans', icon: '&#9654;', label: 'Test Plans' },
  { to: '/gantt', icon: '&#9866;', label: 'Gantt Chart' },
  { to: '/reports', icon: '&#9881;', label: 'Reports' }
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">QA</span>
        <span className="sidebar-brand-text">Workspace</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
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
    </aside>
  )
}
