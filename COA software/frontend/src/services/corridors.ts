import api from './api'
import type { Corridor, CorridorAvailability } from '../types/corridor'
import type { Asset } from '../types/asset'
import type { MaintenanceTask } from '../types/maintenance'
import type { TrainSchedule } from '../types/train'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const corridorService = {
  async getCorridors(params?: {
    page?: number
    page_size?: number
    status?: string
    electrified?: boolean
    search?: string
  }): Promise<PaginatedResponse<Corridor>> {
    const res = await api.get<PaginatedResponse<Corridor>>('/corridors', { params })
    return res.data
  },

  async getCorridorById(id: string): Promise<ApiResponse<Corridor>> {
    const res = await api.get<ApiResponse<Corridor>>(`/corridors/${id}`)
    return res.data
  },

  async getCorridorAssets(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Asset>> {
    const res = await api.get<PaginatedResponse<Asset>>(`/corridors/${id}/assets`, { params })
    return res.data
  },

  async getCorridorMaintenance(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>(`/corridors/${id}/maintenance`, { params })
    return res.data
  },

  async getCorridorTrains(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<TrainSchedule>> {
    const res = await api.get<PaginatedResponse<TrainSchedule>>(`/corridors/${id}/trains`, { params })
    return res.data
  },

  async getCorridorAvailability(id: string): Promise<ApiResponse<CorridorAvailability>> {
    const res = await api.get<ApiResponse<CorridorAvailability>>(`/corridors/${id}/availability`)
    return res.data
  },
}

export default corridorService
