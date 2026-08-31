import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  AIPlanningRequestPayload,
  AIPlanningResultData
} from '../types/aiPlanner'

export const aiPlannerService = {
  /**
   * Generates AI-recommended railway maintenance block plan.
   */
  async generatePlan(payload: AIPlanningRequestPayload): Promise<ApiResponse<AIPlanningResultData>> {
    const res = await apiClient.post<ApiResponse<AIPlanningResultData>>('/ai/planner/generate', payload)
    return res.data
  },

  /**
   * Retrieves past AI planning runs.
   */
  async getPlanningRuns(limit = 20): Promise<ApiResponse<any[]>> {
    const res = await apiClient.get<ApiResponse<any[]>>('/ai/planner/runs', {
      params: { limit }
    })
    return res.data
  }
}
