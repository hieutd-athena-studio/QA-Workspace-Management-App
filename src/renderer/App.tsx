import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import ProjectsPage from './pages/ProjectsPage'
import TestLibraryPage from './pages/TestLibraryPage'
import TestPlansPage from './pages/TestPlansPage'
import TestPlanDetailPage from './pages/TestPlanDetailPage'
import TestCycleDetailPage from './pages/TestCycleDetailPage'
import ExecutionPage from './pages/ExecutionPage'
import GanttPage from './pages/GanttPage'
import ReportsPage from './pages/ReportsPage'
import TestTypesPage from './pages/TestTypesPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/projects" replace />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="library" element={<TestLibraryPage />} />
        <Route path="test-types" element={<TestTypesPage />} />
        <Route path="plans" element={<TestPlansPage />} />
        <Route path="plans/:planId" element={<TestPlanDetailPage />} />
        <Route path="plans/:planId/cycles/:cycleId" element={<TestCycleDetailPage />} />
        <Route path="plans/:planId/cycles/:cycleId/execute" element={<ExecutionPage />} />
        <Route path="gantt" element={<GanttPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  )
}
