import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  BlockEvaluationData,
  BlockEvaluationPayload,
  FeasibleWindowItem,
  FeasibleWindowsPayload
} from '../types/conflict'

export const conflictService = {
  /**
   * Evaluates a candidate block window against all 9 conflict types.
   */
  async evaluateBlock(payload: BlockEvaluationPayload): Promise<ApiResponse<BlockEvaluationData>> {
    const res = await apiClient.post<ApiResponse<BlockEvaluationData>>('/blocks/evaluate', payload)
    return res.data
  },

  /**
   * Scans candidate daily possession slots and returns conflict-free feasible windows.
   */
  async findFeasibleWindows(payload: FeasibleWindowsPayload): Promise<ApiResponse<FeasibleWindowItem[]>> {
    const res = await apiClient.post<ApiResponse<FeasibleWindowItem[]>>('/blocks/feasible-windows', payload)
    return res.data
  }
}
