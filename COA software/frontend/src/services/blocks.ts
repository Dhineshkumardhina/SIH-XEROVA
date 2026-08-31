import api from './api'
import type { BlockPlan, BlockRequest, BlockConflict, BlockImpact } from '../types/block'
import type { MaintenanceTask } from '../types/maintenance'
import type { TrainSchedule } from '../types/train'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const blockService = {
  // Block Plans
  async getBlockPlans(params?: {
    page?: number
    page_size?: number
    corridor?: string
    status?: string
  }): Promise<PaginatedResponse<BlockPlan>> {
    const res = await api.get<PaginatedResponse<BlockPlan>>('/blocks', { params })
    return res.data
  },

  async getBlockPlanById(id: string): Promise<ApiResponse<BlockPlan>> {
    const res = await api.get<ApiResponse<BlockPlan>>(`/blocks/${id}`)
    return res.data
  },

  async getBlockTasks(id: string): Promise<MaintenanceTask[]> {
    const res = await api.get<MaintenanceTask[]>(`/blocks/${id}/tasks`)
    return res.data
  },

  async getBlockConflicts(id: string): Promise<BlockConflict[]> {
    const res = await api.get<BlockConflict[]>(`/blocks/${id}/conflicts`)
    return res.data
  },

  async getBlockTrains(id: string): Promise<TrainSchedule[]> {
    const res = await api.get<TrainSchedule[]>(`/blocks/${id}/trains`)
    return res.data
  },

  async getBlockImpact(id: string): Promise<ApiResponse<BlockImpact>> {
    const res = await api.get<ApiResponse<BlockImpact>>(`/blocks/${id}/impact`)
    return res.data
  },

  async approveBlockPlan(id: string): Promise<BlockPlan> {
    const res = await api.patch<BlockPlan>(`/blocks/${id}/approve`)
    return res.data
  },

  // Block Requests
  async getBlockRequests(params?: {
    page?: number
    page_size?: number
    department?: string
    corridor?: string
    status?: string
    search?: string
  }): Promise<PaginatedResponse<BlockRequest>> {
    const res = await api.get<PaginatedResponse<BlockRequest>>('/blocks/requests', { params })
    return res.data
  },

  async getBlockRequestById(id: string): Promise<ApiResponse<BlockRequest>> {
    const res = await api.get<ApiResponse<BlockRequest>>(`/blocks/requests/${id}`)
    return res.data
  },

  async createBlockRequest(data: Partial<BlockRequest> & { task_ids?: string[] }): Promise<ApiResponse<BlockRequest>> {
    const res = await api.post<ApiResponse<BlockRequest>>('/blocks/requests', data)
    return res.data
  },

  async updateBlockRequest(id: string, data: Partial<BlockRequest>): Promise<ApiResponse<BlockRequest>> {
    const res = await api.put<ApiResponse<BlockRequest>>(`/blocks/requests/${id}`, data)
    return res.data
  },

  async validateBlockRequest(id: string): Promise<ApiResponse<any>> {
    const res = await api.post<ApiResponse<any>>(`/blocks/requests/${id}/validate`)
    return res.data
  },

  async completeBlockRequest(id: string): Promise<ApiResponse<BlockRequest>> {
    const res = await api.post<ApiResponse<BlockRequest>>(`/blocks/requests/${id}/complete`)
    return res.data
  },

  async getBlockRequestConflicts(id: string): Promise<ApiResponse<any>> {
    const res = await api.get<ApiResponse<any>>(`/blocks/requests/${id}/conflicts`)
    return res.data
  },

  async getBlockRequestTasks(id: string): Promise<ApiResponse<MaintenanceTask[]>> {
    const res = await api.get<ApiResponse<MaintenanceTask[]>>(`/blocks/requests/${id}/tasks`)
    return res.data
  },

  async addBlockRequestTask(id: string, taskId: string): Promise<ApiResponse<MaintenanceTask>> {
    const res = await api.post<ApiResponse<MaintenanceTask>>(`/blocks/requests/${id}/tasks?task_id=${taskId}`)
    return res.data
  },

  async removeBlockRequestTask(id: string, taskId: string): Promise<void> {
    await api.delete(`/blocks/requests/${id}/tasks/${taskId}`)
  },

  async submitBlockRequest(id: string): Promise<ApiResponse<BlockRequest>> {
    const res = await api.post<ApiResponse<BlockRequest>>(`/blocks/requests/${id}/submit`)
    return res.data
  },

  async approveBlockRequest(id: string): Promise<ApiResponse<BlockRequest>> {
    const res = await api.post<ApiResponse<BlockRequest>>(`/blocks/requests/${id}/approve`)
    return res.data
  },

  async rejectBlockRequest(id: string, rejection_reason: string): Promise<ApiResponse<BlockRequest>> {
    const res = await api.post<ApiResponse<BlockRequest>>(`/blocks/requests/${id}/reject`, { rejection_reason })
    return res.data
  },
}

export default blockService
