import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { InvalidationProvider } from './contexts/InvalidationContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ProjectProvider } from './contexts/ProjectContext'
import './assets/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <NotificationProvider>
        <InvalidationProvider>
          <ProjectProvider>
            <App />
          </ProjectProvider>
        </InvalidationProvider>
      </NotificationProvider>
    </HashRouter>
  </React.StrictMode>
)
