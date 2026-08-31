import api from './api'
import type { Asset, AssetHealth, AssetRisk } from '../types/asset'
import type { ApiResponse, PaginatedResponse } from '../types/common'
import type { Defect } from '../types/defect'
import type { MaintenanceTask } from '../types/maintenance'

export const assetService = {
  async getAssets(params?: {
    page?: number
    page_size?: number
    department?: string
    asset_type?: string
    corridor?: string
    status?: string
    search?: string
  }): Promise<PaginatedResponse<Asset>> {
    const res = await api.get<PaginatedResponse<Asset>>('/assets', { params })
    return res.data
  },

  async getAssetById(id: string): Promise<ApiResponse<Asset>> {
    const res = await api.get<ApiResponse<Asset>>(`/assets/${id}`)
    return res.data
  },

  async getAssetDefects(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Defect>> {
    const res = await api.get<PaginatedResponse<Defect>>(`/assets/${id}/defects`, { params })
    return res.data
  },

  async getAssetMaintenance(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<MaintenanceTask>> {
    const res = await api.get<PaginatedResponse<MaintenanceTask>>(`/assets/${id}/maintenance`, { params })
    return res.data
  },

  async getAssetHealth(id: string): Promise<ApiResponse<AssetHealth>> {
    const res = await api.get<ApiResponse<AssetHealth>>(`/assets/${id}/health`)
    return res.data
  },

  async getAssetRisk(id: string): Promise<ApiResponse<AssetRisk>> {
    const res = await api.get<ApiResponse<AssetRisk>>(`/assets/${id}/risk`)
    return res.data
  },
}

export default assetService
