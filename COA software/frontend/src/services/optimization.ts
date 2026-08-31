import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  OptimizationRequestPayload,
  OptimizationResultData
} from '../types/optimization'

export const optimizationService = {
  /**
   * Run OR-Tools CP-SAT Block Possession Optimizer.
   */
  async runOptimization(payload: OptimizationRequestPayload): Promise<ApiResponse<OptimizationResultData>> {
    const res = await apiClient.post<ApiResponse<OptimizationResultData>>('/optimization/run', payload)
    return res.data
  },

  /**
   * Get past optimization runs list.
   */
  async getOptimizationRuns(limit = 20): Promise<ApiResponse<any[]>> {
    const res = await apiClient.get<ApiResponse<any[]>>('/optimization/runs', {
      params: { limit }
    })
    return res.data
  }
}
