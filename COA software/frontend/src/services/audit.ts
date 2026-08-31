import api from './api'
import type { AuditLog } from '../types/audit'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const auditService = {
  async getAuditLogs(params?: {
    page?: number
    page_size?: number
    entity_type?: string
    action?: string
  }): Promise<PaginatedResponse<AuditLog>> {
    const res = await api.get<PaginatedResponse<AuditLog>>('/audit', { params })
    return res.data
  },

  async getAuditLogById(id: string): Promise<ApiResponse<AuditLog>> {
    const res = await api.get<ApiResponse<AuditLog>>(`/audit/${id}`)
    return res.data
  },
}

export default auditService
