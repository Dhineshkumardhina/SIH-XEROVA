import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  DailyPlanResult,
  WeeklyPlanResult,
  MonthlyPlanResult,
  BlockMovePayload,
  PlanPublishResult
} from '../types/planner'

export const plannerService = {
  /**
   * Generates or fetches Daily (24h) plan.
   */
  async generateDailyPlan(payload: {
    planning_date: string
    corridor_ids?: string[]
    departments?: string[]
    max_block_duration_minutes?: number
    min_priority?: number
    include_overdue?: boolean
    include_critical?: boolean
    optimization_objective?: any
  }): Promise<ApiResponse<DailyPlanResult>> {
    const res = await apiClient.post<ApiResponse<DailyPlanResult>>('/planner/daily/generate', payload)
    return res.data
  },

  async getDailyPlan(date?: string, corridor_id?: string): Promise<ApiResponse<DailyPlanResult>> {
    const res = await apiClient.get<ApiResponse<DailyPlanResult>>('/planner/daily', {
      params: { date, corridor_id }
    })
    return res.data
  },

  /**
   * Generates or fetches Weekly (7-day) plan.
   */
  async generateWeeklyPlan(payload: {
    start_date: string
    corridor_ids?: string[]
    departments?: string[]
    optimization_objective?: any
  }): Promise<ApiResponse<WeeklyPlanResult>> {
    const res = await apiClient.post<ApiResponse<WeeklyPlanResult>>('/planner/weekly/generate', payload)
    return res.data
  },

  async getWeeklyPlan(start_date?: string): Promise<ApiResponse<WeeklyPlanResult>> {
    const res = await apiClient.get<ApiResponse<WeeklyPlanResult>>('/planner/weekly', {
      params: { start_date }
    })
    return res.data
  },

  /**
   * Generates or fetches Monthly (30-day) plan.
   */
  async generateMonthlyPlan(payload: {
    year: number
    month: number
    corridor_ids?: string[]
    departments?: string[]
  }): Promise<ApiResponse<MonthlyPlanResult>> {
    const res = await apiClient.post<ApiResponse<MonthlyPlanResult>>('/planner/monthly/generate', payload)
    return res.data
  },

  async getMonthlyPlan(year?: number, month?: number): Promise<ApiResponse<MonthlyPlanResult>> {
    const res = await apiClient.get<ApiResponse<MonthlyPlanResult>>('/planner/monthly', {
      params: { year, month }
    })
    return res.data
  },

  /**
   * Reschedules/moves a block window.
   */
  async modifyBlock(planId: string, payload: BlockMovePayload): Promise<ApiResponse<any>> {
    const res = await apiClient.post<ApiResponse<any>>(`/planner/${planId}/modify`, payload)
    return res.data
  },

  /**
   * Publishes an approved block plan.
   */
  async publishPlan(planId: string): Promise<ApiResponse<PlanPublishResult>> {
    const res = await apiClient.post<ApiResponse<PlanPublishResult>>(`/planner/${planId}/publish`)
    return res.data
  },

  /**
   * Resets a block plan.
   */
  async resetPlan(planId: string): Promise<ApiResponse<any>> {
    const res = await apiClient.post<ApiResponse<any>>(`/planner/${planId}/reset`)
    return res.data
  }
}
