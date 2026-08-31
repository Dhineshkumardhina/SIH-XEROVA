/**
 * RAILOPT AI — Reports API Service
 * Interacts with /api/v1/reports/* for report compilation, status tracking, and file downloads.
 */
import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type { ReportItem, ReportDetail, ReportGeneratePayload } from '../types/reports'

export const reportService = {
  /**
   * Generates a new operational report
   */
  async generateReport(payload: ReportGeneratePayload): Promise<ApiResponse<ReportDetail>> {
    const res = await apiClient.post<ApiResponse<ReportDetail>>('/reports/generate', payload)
    return res.data
  },

  /**
   * Lists generated report history
   */
  async getReportHistory(limit = 50): Promise<ApiResponse<ReportItem[]>> {
    const res = await apiClient.get<ApiResponse<ReportItem[]>>('/reports', {
      params: { limit }
    })
    return res.data
  },

  /**
   * Retrieves full details and data of a specific report
   */
  async getReportById(id: string): Promise<ApiResponse<ReportDetail>> {
    const res = await apiClient.get<ApiResponse<ReportDetail>>(`/reports/${id}`)
    return res.data
  },

  /**
   * Downloads report in PDF format
   */
  async downloadPdf(id: string, filename = 'report.pdf'): Promise<void> {
    const res = await apiClient.get(`/reports/${id}/pdf`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Downloads report in CSV format
   */
  async downloadCsv(id: string, filename = 'report.csv'): Promise<void> {
    const res = await apiClient.get(`/reports/${id}/csv`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /**
   * Downloads report in Excel (.xlsx) format
   */
  async downloadExcel(id: string, filename = 'report.xlsx'): Promise<void> {
    const res = await apiClient.get(`/reports/${id}/excel`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(
      new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    )
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}
