import api from './api'
import type { Defect } from '../types/defect'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const defectService = {
  async getDefects(params?: {
    page?: number
    page_size?: number
    severity?: string
    department?: string
    corridor?: string
    status?: string
    search?: string
  }): Promise<PaginatedResponse<Defect>> {
    const res = await api.get<PaginatedResponse<Defect>>('/defects', { params })
    return res.data
  },

  async getDefectById(id: string): Promise<ApiResponse<Defect>> {
    const res = await api.get<ApiResponse<Defect>>(`/defects/${id}`)
    return res.data
  },

  async getCriticalDefects(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Defect>> {
    const res = await api.get<PaginatedResponse<Defect>>('/defects/critical', { params })
    return res.data
  },

  async getHighRiskDefects(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Defect>> {
    const res = await api.get<PaginatedResponse<Defect>>('/defects/high-risk', { params })
    return res.data
  },

  async getOverdueDefects(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Defect>> {
    const res = await api.get<PaginatedResponse<Defect>>('/defects/status/overdue', { params })
    return res.data
  },

  async assignDefect(id: string, assigned_to: string): Promise<ApiResponse<Defect>> {
    const res = await api.post<ApiResponse<Defect>>(`/defects/${id}/assign`, { assigned_to })
    return res.data
  },

  async startResolution(id: string): Promise<ApiResponse<Defect>> {
    const res = await api.post<ApiResponse<Defect>>(`/defects/${id}/start`)
    return res.data
  },

  async resolveDefect(id: string, resolution_notes: string): Promise<ApiResponse<Defect>> {
    const res = await api.post<ApiResponse<Defect>>(`/defects/${id}/resolve`, { resolution_notes })
    return res.data
  },

  async closeDefect(id: string): Promise<ApiResponse<Defect>> {
    const res = await api.post<ApiResponse<Defect>>(`/defects/${id}/close`)
    return res.data
  },

  async getAnalytics(): Promise<ApiResponse<any>> {
    const res = await api.get<ApiResponse<any>>('/defects/metrics/analytics')
    return res.data
  },

  async getDepartmentBreakdown(): Promise<ApiResponse<any[]>> {
    const res = await api.get<ApiResponse<any[]>>('/defects/metrics/department-breakdown')
    return res.data
  },

  async getCorridorIntelligence(): Promise<ApiResponse<any[]>> {
    const res = await api.get<ApiResponse<any[]>>('/defects/metrics/corridor-intelligence')
    return res.data
  },

  async getTrends(): Promise<ApiResponse<any[]>> {
    const res = await api.get<ApiResponse<any[]>>('/defects/metrics/trends')
    return res.data
  },
}

export default defectService
