import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { TestPlan, TestCycle, ReportData, MultiCycleReportData } from '@shared/types'
import { useApi } from '../hooks/useApi'
import { useNotification } from '../contexts/NotificationContext'
import { useProject } from '../contexts/ProjectContext'
import './ReportsPage.css'

const ALL_CYCLES_VALUE = 'all'

export default function ReportsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { notify } = useNotification()
  const { selectedProject } = useProject()
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [selectedCycleOption, setSelectedCycleOption] = useState<string>('')
  const [reportData, setReportData] = useState<ReportData | MultiCycleReportData | null>(null)
  const [isMultiCycle, setIsMultiCycle] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)

  const { data: plans } = useApi<TestPlan[]>(
    () => selectedProject
      ? window.api.testPlans.getByProject(selectedProject.id)
      : Promise.resolve([]),
    [selectedProject?.id],
    'testPlans'
  )
  const { data: cycles } = useApi<TestCycle[]>(
    () => selectedPlanId ? window.api.testCycles.getByPlan(selectedPlanId) : Promise.resolve([]),
    [selectedPlanId], 'testCycles'
  )

  useEffect(() => {
    const cid = searchParams.get('cycleId')
    if (cid) setSelectedCycleOption(cid)
  }, [searchParams])

  useEffect(() => {
    if (!selectedCycleOption) { setReportData(null); setIsMultiCycle(false); return }
    setLoadingReport(true)

    if (selectedCycleOption === ALL_CYCLES_VALUE) {
      // Aggregate all cycles for this plan
      const cycleIds = (cycles || []).map(c => c.id)
      if (cycleIds.length === 0) {
        setReportData(null)
        setIsMultiCycle(false)
        setLoadingReport(false)
        return
      }
      setIsMultiCycle(true)
      window.api.reports.getMultiCycleData(cycleIds)
        .then(setReportData)
        .catch((e: Error) => notify(e.message, 'error'))
        .finally(() => setLoadingReport(false))
    } else {
      setIsMultiCycle(false)
      window.api.reports.getData(Number(selectedCycleOption))
        .then(setReportData)
        .catch((e: Error) => notify(e.message, 'error'))
        .finally(() => setLoadingReport(false))
    }
  }, [selectedCycleOption, cycles])

  const handleExport = async (format: 'pdf' | 'html') => {
    if (!selectedCycleOption || selectedCycleOption === ALL_CYCLES_VALUE) return
    try {
      await window.api.reports.generate(Number(selectedCycleOption), format)
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
        return `conic-gradient(var(--success) 0% ${p1}%, var(--critical) ${p1}% ${p2}%, #d97706 ${p2}% ${p3}%, #d1d5db ${p3}% 100%)`
      })()
    : 'conic-gradient(#d1d5db 0% 100%)'

  const pct = (n: number) => reportData && reportData.total > 0
    ? Math.round((n / reportData.total) * 100)
    : 0

  if (!selectedProject) return (
    <div className="no-project-guard">
      <p className="no-project-guard-title">No project selected</p>
      <p className="no-project-guard-desc">Select a project to view its reports.</p>
      <button className="btn btn-primary" onClick={() => navigate('/projects')}>Go to Projects</button>
    </div>
  )

  return (
    <div className="reports-page">
      <div className="reports-page-header">
        <h1>Reports</h1>
      </div>

      {/* Selectors */}
      <div className="report-selector-card">
        <div className="form-group">
          <label className="tcf-label">Test Plan</label>
          <select
            className="select"
            value={selectedPlanId ?? ''}
            onChange={(e) => { setSelectedPlanId(e.target.value ? Number(e.target.value) : null); setSelectedCycleOption('') }}
          >
            <option value="">Select a plan…</option>
            {plans?.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.version})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="tcf-label">Test Cycle</label>
          <select
            className="select"
            value={selectedCycleOption}
            onChange={(e) => setSelectedCycleOption(e.target.value)}
            disabled={!selectedPlanId}
          >
            <option value="">Select a cycle…</option>
            {cycles && cycles.length > 1 && (
              <option value={ALL_CYCLES_VALUE}>All Cycles ({cycles.length})</option>
            )}
            {cycles?.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.build_name}</option>)}
          </select>
        </div>
      </div>

      {loadingReport ? (
        <div className="text-muted body-sm" style={{ textAlign: 'center', padding: 'var(--sp-8)' }}>Loading report…</div>
      ) : !reportData ? (
        <div className="reports-empty">
          <div className="reports-empty-icon">📊</div>
          <p className="reports-empty-title">Select a cycle to view its report</p>
          <p className="reports-empty-desc">Choose a test plan and cycle above to see pass/fail metrics and export a report.</p>
        </div>
      ) : (
        <>
          {/* Summary card */}
          <div className="report-summary-card">
            <div className="report-summary-header">
              <div className="report-summary-title">{isMultiCycle ? 'Multi-Cycle Report' : 'Test Cycle Report'}</div>
              <div className="report-summary-subtitle">
                {reportData.plan_name} {reportData.plan_version}
                {isMultiCycle
                  ? ` — ${(reportData as MultiCycleReportData).cycle_names.length} cycles`
                  : ` — ${(reportData as ReportData).cycle_name}`
                }
              </div>
              {isMultiCycle && (
                <div className="report-cycle-list">
                  {(reportData as MultiCycleReportData).cycle_names.map((name, i) => (
                    <span key={i} className="report-cycle-tag">{name}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="report-summary-body">
              {/* Donut */}
              <div className="report-donut" style={{ background: donutGradient }}>
                <div className="report-donut-inner">
                  <span className="report-donut-pct">{reportData.coverage_percent}%</span>
                  <span className="report-donut-label">Coverage</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="report-stats-grid">
                <div className="report-stat-block">
                  <span className="report-stat-number" style={{ color: 'var(--success)' }}>{reportData.passed}</span>
                  <span className="report-stat-name">Passed</span>
                  <span className="report-stat-pct">{pct(reportData.passed)}% of total</span>
                </div>
                <div className="report-stat-block">
                  <span className="report-stat-number" style={{ color: 'var(--critical)' }}>{reportData.failed}</span>
                  <span className="report-stat-name">Failed</span>
                  <span className="report-stat-pct">{pct(reportData.failed)}% of total</span>
                </div>
                <div className="report-stat-block">
                  <span className="report-stat-number" style={{ color: '#d97706' }}>{reportData.blocked}</span>
                  <span className="report-stat-name">Blocked</span>
                  <span className="report-stat-pct">{pct(reportData.blocked)}% of total</span>
                </div>
                <div className="report-stat-block">
                  <span className="report-stat-number" style={{ color: '#6b7280' }}>{reportData.unexecuted}</span>
                  <span className="report-stat-name">Pending</span>
                  <span className="report-stat-pct">{pct(reportData.unexecuted)}% of total</span>
                </div>
              </div>
            </div>

            <div className="report-coverage-row">
              <span className="report-coverage-text">{reportData.total - reportData.unexecuted} of {reportData.total} test cases executed</span>
              <div className="report-coverage-track">
                <div className="report-coverage-fill" style={{ width: `${reportData.coverage_percent}%` }} />
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                {reportData.coverage_percent}%
              </span>
            </div>
          </div>

          {/* Failed cases */}
          {reportData.failed_cases.length > 0 && (
            <div className="report-failed-section">
              <p className="report-section-title">Failed &amp; Blocked Test Cases</p>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test Case</th>
                    <th>Category / Subcategory</th>
                    {isMultiCycle && <th>Cycle</th>}
                    <th>Status</th>
                    <th>Bug Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.failed_cases.map((fc, i) => (
                    <tr key={i}>
                      <td>{fc.title}</td>
                      <td className="secondary">{fc.category_name} / {fc.subcategory_name}</td>
                      {isMultiCycle && <td className="secondary">{(fc as MultiCycleReportData['failed_cases'][number]).cycle_name}</td>}
                      <td><span className={`status-badge status-${fc.status.toLowerCase()}`}>{fc.status}</span></td>
                      <td className="mono">{fc.bug_ref || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Export */}
          <div className="report-export-row">
            {!isMultiCycle && (
              <>
                <button className="btn btn-primary" onClick={() => handleExport('pdf')}>Export as PDF</button>
                <button className="btn btn-secondary" onClick={() => handleExport('html')}>Export as HTML</button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
