import api from './api'
import type { AIPriorityPrediction } from '../types/ai_priority'

export const aiPriorityService = {
  async calculatePriority(taskId: string): Promise<AIPriorityPrediction> {
    const res = await api.post<AIPriorityPrediction>('/ai/priority/calculate', { task_id: taskId })
    return res.data
  },

  async calculateBatch(taskIds: string[]): Promise<AIPriorityPrediction[]> {
    const res = await api.post<AIPriorityPrediction[]>('/ai/priority/calculate-batch', { task_ids: taskIds })
    return res.data
  },

  async getPriorityTasks(limit: number = 100): Promise<AIPriorityPrediction[]> {
    const res = await api.get<AIPriorityPrediction[]>('/ai/priority/tasks', { params: { limit } })
    return res.data
  },

  async getTopPriorityTasks(limit: number = 10): Promise<AIPriorityPrediction[]> {
    const res = await api.get<AIPriorityPrediction[]>('/ai/priority/top', { params: { limit } })
    return res.data
  },

  async recalculatePriorities(scope: string): Promise<{ recalculated_count: number }> {
    const res = await api.post<{ recalculated_count: number }>('/ai/priority/recalculate', { scope })
    return res.data
  }
}

export default aiPriorityService
