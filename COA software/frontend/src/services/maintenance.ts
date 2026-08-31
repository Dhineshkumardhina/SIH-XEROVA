import api from './api'
import type { MaintenanceTask } from '../types/maintenance'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const maintenanceService = {
  async getTasks(params?: {
    page?: number
    page_size?: number
    department?: string
    corridor?: string
    status?: string
    priority?: string
    search?: string
  }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>('/maintenance/tasks', { params })
    return res.data
  },

  async getTaskById(id: string): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.get<ApiResponse<MaintenanceTask>>(`/maintenance/tasks/${id}`)
    return res.data
  },

  async getOverdueTasks(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>('/maintenance/overdue', { params })
    return res.data
  },

  async getCriticalTasks(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>('/maintenance/critical', { params })
    return res.data
  },

  async getTodayTasks(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>('/maintenance/today', { params })
    return res.data
  },

  async getUpcomingTasks(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>('/maintenance/upcoming', { params })
    return res.data
  },

  async completeTask(id: string, payload: { completion_notes?: string; actual_duration_minutes?: number }): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.post<ApiResponse<MaintenanceTask>>(`/maintenance/tasks/${id}/complete`, payload)
    return res.data
  },

  async startTask(id: string): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.post<ApiResponse<MaintenanceTask>>(`/maintenance/tasks/${id}/start`)
    return res.data
  },

  async cancelTask(id: string, payload: { cancellation_reason: string }): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.post<ApiResponse<MaintenanceTask>>(`/maintenance/tasks/${id}/cancel`, payload)
    return res.data
  },

  async createTask(payload: Partial<MaintenanceTask>): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.post<ApiResponse<MaintenanceTask>>('/maintenance/tasks', payload)
    return res.data
  },

  async updateTask(id: string, payload: Partial<MaintenanceTask>): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.put<ApiResponse<MaintenanceTask>>(`/maintenance/tasks/${id}`, payload)
    return res.data
  },

  async getAnalytics(): Promise<ApiResponse<any>> {
    const res = await api.get<ApiResponse<any>>('/maintenance/analytics')
    return res.data
  },

  async getDepartmentWorkload(): Promise<ApiResponse<any[]>> {
    const res = await api.get<ApiResponse<any[]>>('/maintenance/department-workload')
    return res.data
  }
}

export default maintenanceService
