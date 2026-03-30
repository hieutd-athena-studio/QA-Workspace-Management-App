import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TestPlan, TestCycle, ReportData } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useNotification } from '../contexts/NotificationContext'
import EmptyState from '../components/shared/EmptyState'
import './ReportsPage.css'

export default function ReportsPage() {
  const [searchParams] = useSearchParams()
  const { notify } = useNotification()
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  const { data: plans } = useApi<TestPlan[]>(() => window.api.testPlans.getAll(), [], 'testPlans')
  const { data: cycles } = useApi<TestCycle[]>(
    () => selectedPlanId ? window.api.testCycles.getByPlan(selectedPlanId) : Promise.resolve([]),
    [selectedPlanId], 'testCycles'
  )

  // Handle URL param pre-selection
  useEffect(() => {
    const cid = searchParams.get('cycleId')
    if (cid) setSelectedCycleId(Number(cid))
  }, [searchParams])

  // Fetch report data when cycle selected
  useEffect(() => {
    if (!selectedCycleId) { setReportData(null); return }
    setLoadingReport(true)
    window.api.reports.getData(selectedCycleId)
      .then(setReportData)
      .catch((e: Error) => notify(e.message, 'error'))
      .finally(() => setLoadingReport(false))
  }, [selectedCycleId])

  const handleExport = async (format: 'pdf' | 'html') => {
    if (!selectedCycleId) return
    try {
      await window.api.reports.generate(selectedCycleId, format)
      notify(`Report exported as ${format.toUpperCase()}`, 'success')
    } catch (e: unknown) {
      const msg = (e as Error).message
      if (!msg.includes('cancelled')) notify(msg, 'error')
    }
  }

  const donutGradient = reportData && reportData.total > 0
    ? (() => {
        const t = reportData.total
        const p1 = (reportData.passed / t) * 100
        const p2 = p1 + (reportData.failed / t) * 100
        const p3 = p2 + (reportData.blocked / t) * 100
        return `conic-gradient(var(--success) 0% ${p1}%, var(--critical) ${p1}% ${p2}%, var(--warning) ${p2}% ${p3}%, #d1d5db ${p3}% 100%)`
      })()
    : 'conic-gradient(#d1d5db 0% 100%)'

  return (
    <div className="reports-page">
      <h1 className="headline-sm" style={{ marginBottom: 'var(--sp-6)' }}>Reports</h1>

      <div className="report-selectors flex gap-4" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="form-group flex-1">
          <label className="form-label">Test Plan</label>
          <select
            className="select"
            value={selectedPlanId ?? ''}
            onChange={(e) => { setSelectedPlanId(e.target.value ? Number(e.target.value) : null); setSelectedCycleId(null) }}
          >
            <option value="">Select a plan...</option>
            {plans?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.version})</option>)}
          </select>
        </div>
        <div className="form-group flex-1">
          <label className="form-label">Test Cycle</label>
          <select
            className="select"
            value={selectedCycleId ?? ''}
            onChange={(e) => setSelectedCycleId(e.target.value ? Number(e.target.value) : null)}
            disabled={!selectedPlanId}
          >
            <option value="">Select a cycle...</option>
            {cycles?.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.build_name}</option>)}
          </select>
        </div>
      </div>

      {loadingReport ? (
        <div className="text-muted body-sm" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>Loading report...</div>
      ) : !reportData ? (
        <EmptyState
          icon="&#128202;"
          title="Select a cycle"
          description="Choose a test plan and cycle above to view the report."
        />
      ) : (
        <>
          <div className="report-summary card">
            <div className="report-summary-content flex gap-6">
              <div className="report-donut" style={{ background: donutGradient }}>
                <div className="report-donut-center">
                  <span className="display-sm">{reportData.coverage_percent}%</span>
                  <span className="body-sm text-muted">Coverage</span>
                </div>
              </div>
              <div className="report-stats flex-col gap-3">
                <div className="report-stat"><span className="report-stat-value" style={{ color: 'var(--success)' }}>{reportData.passed}</span><span className="report-stat-label">Passed ({reportData.total > 0 ? Math.round((reportData.passed / reportData.total) * 100) : 0}%)</span></div>
                <div className="report-stat"><span className="report-stat-value" style={{ color: 'var(--critical)' }}>{reportData.failed}</span><span className="report-stat-label">Failed ({reportData.total > 0 ? Math.round((reportData.failed / reportData.total) * 100) : 0}%)</span></div>
                <div className="report-stat"><span className="report-stat-value" style={{ color: '#b45309' }}>{reportData.blocked}</span><span className="report-stat-label">Blocked ({reportData.total > 0 ? Math.round((reportData.blocked / reportData.total) * 100) : 0}%)</span></div>
                <div className="report-stat"><span className="report-stat-value" style={{ color: '#6b7280' }}>{reportData.unexecuted}</span><span className="report-stat-label">Pending ({reportData.total > 0 ? Math.round((reportData.unexecuted / reportData.total) * 100) : 0}%)</span></div>
              </div>
            </div>
            <p className="body-sm text-muted" style={{ marginTop: 'var(--sp-4)' }}>
              Total: {reportData.total} test cases — {reportData.total - reportData.unexecuted} executed, {reportData.unexecuted} remaining
            </p>
          </div>

          {reportData.failed_cases.length > 0 && (
            <div style={{ marginTop: 'var(--sp-6)' }}>
              <h2 className="title-sm" style={{ marginBottom: 'var(--sp-3)' }}>Failed &amp; Blocked Test Cases</h2>
              <table className="data-table">
                <thead>
                  <tr><th>Test Case</th><th>Folder</th><th>Status</th><th>Bug Ref</th></tr>
                </thead>
                <tbody>
                  {reportData.failed_cases.map((fc, i) => (
                    <tr key={i}>
                      <td>{fc.title}</td>
                      <td className="secondary">{fc.folder_path}</td>
                      <td><span className={`status-badge status-${fc.status.toLowerCase()}`}>{fc.status}</span></td>
                      <td className="mono">{fc.bug_ref || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex gap-3" style={{ marginTop: 'var(--sp-6)' }}>
            <button className="btn btn-primary" onClick={() => handleExport('pdf')}>Export as PDF</button>
            <button className="btn btn-secondary" onClick={() => handleExport('html')}>Export as HTML</button>
          </div>
        </>
      )}
    </div>
  )
}
