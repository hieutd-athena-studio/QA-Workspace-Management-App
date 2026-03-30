import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'fs'
import { IPC } from '@shared/ipc-channels'
import { wrapSuccess, wrapError } from '@shared/types/ipc-result'
import { ReportRepository } from '../database/repositories/report.repo'
import { getDatabase } from '../database/connection'
import { generateReportHtml } from '../services/report-generator'

export function registerReportHandlers(): void {
  const repo = new ReportRepository(getDatabase())

  ipcMain.handle(IPC.REPORTS.GET_DATA, (_e, cycleId: number) => {
    try {
      return wrapSuccess(repo.getReportData(cycleId))
    } catch (e: unknown) {
      return wrapError('REPORT_DATA', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.REPORTS.GET_BY_CYCLE, (_e, cycleId: number) => {
    try {
      return wrapSuccess(repo.getByCycle(cycleId))
    } catch (e: unknown) {
      return wrapError('REPORT_GET', (e as Error).message)
    }
  })

  ipcMain.handle(IPC.REPORTS.GENERATE, async (_e, cycleId: number, format: 'pdf' | 'html') => {
    try {
      const data = repo.getReportData(cycleId)
      const html = generateReportHtml(data)

      const defaultName = `report-${data.plan_name}-${data.cycle_name}-${new Date().toISOString().slice(0, 10)}`
      const ext = format === 'pdf' ? 'pdf' : 'html'

      const result = await dialog.showSaveDialog({
        defaultPath: `${defaultName}.${ext}`,
        filters: [
          format === 'pdf'
            ? { name: 'PDF Files', extensions: ['pdf'] }
            : { name: 'HTML Files', extensions: ['html'] }
        ]
      })

      if (result.canceled || !result.filePath) {
        return wrapError('REPORT_CANCELLED', 'Export cancelled')
      }

      if (format === 'html') {
        writeFileSync(result.filePath, html, 'utf-8')
      } else {
        // Render HTML in hidden window then printToPDF
        const win = new BrowserWindow({
          show: false,
          width: 800,
          height: 600,
          webPreferences: { offscreen: true }
        })
        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          pageSize: 'A4',
          margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 }
        })
        writeFileSync(result.filePath, pdfBuffer)
        win.destroy()
      }

      const report = repo.save(cycleId, format, result.filePath)
      return wrapSuccess(report)
    } catch (e: unknown) {
      return wrapError('REPORT_GENERATE', (e as Error).message)
    }
  })
}
