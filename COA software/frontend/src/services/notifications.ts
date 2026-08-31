import api from './api'
import type { Notification } from '../types/notification'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const notificationService = {
  async getNotifications(params?: {
    page?: number
    page_size?: number
    is_read?: boolean
  }): Promise<PaginatedResponse<Notification>> {
    const res = await api.get<PaginatedResponse<Notification>>('/notifications', { params })
    return res.data
  },

  async getAll(params?: {
    page?: number
    page_size?: number
    is_read?: boolean
  }): Promise<PaginatedResponse<Notification>> {
    return this.getNotifications(params)
  },

  async getUnreadNotifications(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Notification>> {
    const res = await api.get<PaginatedResponse<Notification>>('/notifications/unread', { params })
    return res.data
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    const res = await api.post<ApiResponse<Notification>>(`/notifications/${id}/read`)
    return res.data
  },

  async markAllAsRead(): Promise<ApiResponse<{ marked_read_count: number }>> {
    const res = await api.post<ApiResponse<{ marked_read_count: number }>>('/notifications/read-all')
    return res.data
  },
}

export const notificationsApi = notificationService
export default notificationService
