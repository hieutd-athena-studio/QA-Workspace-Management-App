import type { ReportData } from '@shared/types'

export function generateReportHtml(data: ReportData): string {
  const failedRows = data.failed_cases
    .map(
      (fc) => `
      <tr>
        <td>${esc(fc.title)}</td>
        <td>${esc(fc.category_name)} / ${esc(fc.subcategory_name)}</td>
        <td class="status-${fc.status.toLowerCase()}">${esc(fc.status)}</td>
        <td class="mono">${esc(fc.bug_ref || '—')}</td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Test Report — ${esc(data.plan_name)} / ${esc(data.cycle_name)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; background: #faf8ff; padding: 40px; }
  .header { margin-bottom: 32px; }
  .header h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
  .header .meta { font-size: 13px; color: #6c757d; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; }
  .stat-card { flex: 1; padding: 20px; border-radius: 8px; background: #fff; }
  .stat-card .value { font-size: 28px; font-weight: 600; }
  .stat-card .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; margin-top: 4px; }
  .stat-card.pass .value { color: #006d4a; }
  .stat-card.fail .value { color: #9f403d; }
  .stat-card.blocked .value { color: #b45309; }
  .stat-card.coverage .value { color: #005ac2; }
  .coverage-bar { height: 8px; border-radius: 4px; background: #e5e7eb; margin-top: 12px; overflow: hidden; }
  .coverage-bar .fill { height: 100%; border-radius: 4px; background: #005ac2; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; }
  th { text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; padding: 12px 16px; }
  td { padding: 12px 16px; font-size: 14px; }
  tr:nth-child(even) td { background: #f2f3ff; }
  .status-fail { color: #9f403d; font-weight: 600; }
  .status-blocked { color: #b45309; font-weight: 600; }
  .mono { font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 13px; }
  .section-title { font-size: 16px; font-weight: 600; margin-top: 32px; margin-bottom: 8px; }
  .footer { margin-top: 40px; font-size: 12px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <h1>Test Report</h1>
    <div class="meta">${esc(data.plan_name)} v${esc(data.plan_version)} — ${esc(data.cycle_name)} (${esc(data.build_name)})</div>
    <div class="meta">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="summary">
    <div class="stat-card pass">
      <div class="value">${data.passed}</div>
      <div class="label">Passed</div>
    </div>
    <div class="stat-card fail">
      <div class="value">${data.failed}</div>
      <div class="label">Failed</div>
    </div>
    <div class="stat-card blocked">
      <div class="value">${data.blocked}</div>
      <div class="label">Blocked</div>
    </div>
    <div class="stat-card coverage">
      <div class="value">${data.coverage_percent}%</div>
      <div class="label">Coverage</div>
      <div class="coverage-bar"><div class="fill" style="width:${data.coverage_percent}%"></div></div>
    </div>
  </div>

  <div class="section-title">Total: ${data.total} test cases — ${data.total - data.unexecuted} executed, ${data.unexecuted} remaining</div>

  ${
    data.failed_cases.length > 0
      ? `
  <div class="section-title">Failed &amp; Blocked Test Cases</div>
  <table>
    <thead><tr><th>Test Case</th><th>Category / Subcategory</th><th>Status</th><th>Bug Ref</th></tr></thead>
    <tbody>${failedRows}</tbody>
  </table>`
      : '<div class="section-title" style="color:#006d4a">All tests passed!</div>'
  }

  <div class="footer">QA Workspace Management — Report</div>
</body>
</html>`
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
