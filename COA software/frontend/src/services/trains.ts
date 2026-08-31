import api from './api'
import type { Train, TrainSchedule, TrainMovement, GoodsForecast } from '../types/train'
import type { ApiResponse, PaginatedResponse } from '../types/common'

export const trainService = {
  async getTrains(params?: {
    page?: number
    page_size?: number
    train_type?: string
    direction?: string
    status?: string
    is_goods_train?: boolean
    is_passenger_train?: boolean
    corridor?: string
    station?: string
    date?: string
    start_date?: string
    end_date?: string
    search?: string
  }): Promise<PaginatedResponse<Train>> {
    const res = await api.get<PaginatedResponse<Train>>('/trains', { params })
    return res.data
  },

  async getTrainById(id: string): Promise<ApiResponse<Train>> {
    const res = await api.get<ApiResponse<Train>>(`/trains/${id}`)
    return res.data
  },

  async getTrainSchedule(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<TrainSchedule>> {
    const res = await api.get<PaginatedResponse<TrainSchedule>>(`/trains/${id}/schedule`, { params })
    return res.data
  },

  async getTrainMovements(id: string, params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<TrainMovement>> {
    const res = await api.get<PaginatedResponse<TrainMovement>>(`/trains/${id}/movements`, { params })
    return res.data
  },

  async getSchedules(params?: {
    page?: number
    page_size?: number
    date?: string
    corridor?: string
    station?: string
  }): Promise<PaginatedResponse<TrainSchedule>> {
    const res = await api.get<PaginatedResponse<TrainSchedule>>('/trains/schedule', { params })
    return res.data
  },

  async getMovements(params?: {
    page?: number
    page_size?: number
    corridor?: string
    status?: string
  }): Promise<PaginatedResponse<TrainMovement>> {
    const res = await api.get<PaginatedResponse<TrainMovement>>('/trains/movements', { params })
    return res.data
  },

  async getForecast(params?: {
    page?: number
    page_size?: number
    corridor?: string
  }): Promise<PaginatedResponse<GoodsForecast>> {
    const res = await api.get<PaginatedResponse<GoodsForecast>>('/trains/forecast', { params })
    return res.data
  },

  async getTrainDensity(corridorId: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    const res = await api.get<ApiResponse<any>>(`/corridors/${corridorId}/train-density`, {
      params: { start_date: startDate, end_date: endDate }
    })
    return res.data
  },

  async syncCOA(): Promise<ApiResponse<any>> {
    const res = await api.post<ApiResponse<any>>('/integrations/coa/sync')
    return res.data
  },
}

export default trainService
