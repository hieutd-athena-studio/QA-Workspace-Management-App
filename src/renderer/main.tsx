import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { InvalidationProvider } from './contexts/InvalidationContext'
import { NotificationProvider } from './contexts/NotificationContext'
import './assets/styles/global.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <NotificationProvider>
        <InvalidationProvider>
          <App />
        </InvalidationProvider>
      </NotificationProvider>
    </HashRouter>
  </React.StrictMode>
)
