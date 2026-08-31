import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type { TrainImpactData, TrainImpactRequestPayload } from '../types/trainImpact'

export const trainImpactService = {
  /**
   * Calculates simulated train impact and lower-impact alternative windows for a candidate block window.
   */
  async calculateTrainImpact(payload: TrainImpactRequestPayload): Promise<ApiResponse<TrainImpactData>> {
    const res = await apiClient.post<ApiResponse<TrainImpactData>>('/ai/train-impact', payload)
    return res.data
  },

  /**
   * Calculates and saves train impact analysis for a specific block request.
   */
  async calculateBlockRequestImpact(requestId: string): Promise<ApiResponse<TrainImpactData>> {
    const res = await apiClient.post<ApiResponse<TrainImpactData>>(`/ai/train-impact/blocks/requests/${requestId}`)
    return res.data
  }
}
