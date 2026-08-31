import api from './api'
import type {
  RiskPrediction,
  RiskHistoryItem,
  HighRiskAsset,
  RiskSummary
} from '../types/risk'
import type { ApiResponse } from '../types/common'

export const riskService = {
  async predictRisk(assetId: string, horizonDays: number = 30): Promise<ApiResponse<RiskPrediction>> {
    const res = await api.post<ApiResponse<RiskPrediction>>('/ai/risk/predict', {
      asset_id: assetId,
      horizon_days: horizonDays
    })
    return res.data
  },

  async predictBulkRisk(assetIds: string[], horizonDays: number = 30): Promise<any> {
    const res = await api.post('/ai/risk/predict/bulk', {
      asset_ids: assetIds,
      horizon_days: horizonDays
    })
    return res.data
  },

  async getRiskSummary(): Promise<ApiResponse<RiskSummary>> {
    const res = await api.get<ApiResponse<RiskSummary>>('/ai/risk/summary')
    return res.data
  },

  async getHighRiskAssets(params?: {
    page?: number
    limit?: number
    department?: string
    asset_type?: string
    corridor_id?: string
    risk_level?: string
    horizon_days?: number
  }): Promise<{ success: boolean; data: { items: HighRiskAsset[]; pagination: any }; message: string }> {
    const res = await api.get('/ai/risk/high-risk', { params })
    return res.data
  },

  async getRiskHistory(assetId: string, limit: number = 20): Promise<{ success: boolean; data: RiskHistoryItem[] }> {
    const res = await api.get(`/ai/risk/${assetId}/history`, { params: { limit } })
    return res.data
  },

  async getLatestAssetRisk(assetId: string, horizonDays: number = 30): Promise<{ success: boolean; data: RiskPrediction }> {
    const res = await api.get(`/ai/risk/${assetId}`, { params: { horizon_days: horizonDays } })
    return res.data
  }
}

export default riskService
