/**
 * RAILOPT AI — Analytics API Service
 * Fetches all operational intelligence from /api/v1/analytics/*
 */
import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  DashboardKPIs,
  AssetAnalyticsData,
  MaintenanceAnalyticsData,
  BlockAnalyticsData,
  TrainImpactAnalyticsData,
  CorridorAnalyticsData
} from '../types/analytics'

export const analyticsService = {
  /**
   * Executive Dashboard Analytics Overview
   */
  async getDashboard(params?: {
    start_date?: string
    end_date?: string
    department?: string
    corridor_id?: string
  }): Promise<ApiResponse<DashboardKPIs>> {
    const res = await apiClient.get<ApiResponse<DashboardKPIs>>('/analytics/dashboard', { params })
    return res.data
  },

  /**
   * Asset Analytics & Degradation
   */
  async getAssetAnalytics(params?: {
    department?: string
    corridor_id?: string
    asset_type?: string
  }): Promise<ApiResponse<AssetAnalyticsData>> {
    const res = await apiClient.get<ApiResponse<AssetAnalyticsData>>('/analytics/assets', { params })
    return res.data
  },

  /**
   * Maintenance Analytics & Workload
   */
  async getMaintenanceAnalytics(params?: {
    start_date?: string
    end_date?: string
    department?: string
    corridor_id?: string
    status?: string
  }): Promise<ApiResponse<MaintenanceAnalyticsData>> {
    const res = await apiClient.get<ApiResponse<MaintenanceAnalyticsData>>('/analytics/maintenance', { params })
    return res.data
  },

  /**
   * Block Utilization & Shared Blocks Analytics
   */
  async getBlockAnalytics(params?: {
    start_date?: string
    end_date?: string
    corridor_id?: string
  }): Promise<ApiResponse<BlockAnalyticsData>> {
    const res = await apiClient.get<ApiResponse<BlockAnalyticsData>>('/analytics/blocks', { params })
    return res.data
  },

  /**
   * Train Impact & Delay Analytics
   */
  async getTrainImpactAnalytics(params?: {
    start_date?: string
    end_date?: string
    corridor_id?: string
  }): Promise<ApiResponse<TrainImpactAnalyticsData>> {
    const res = await apiClient.get<ApiResponse<TrainImpactAnalyticsData>>('/analytics/train-impact', { params })
    return res.data
  },

  /**
   * Corridor Performance & Risk Ranking
   */
  async getCorridorAnalytics(): Promise<ApiResponse<CorridorAnalyticsData>> {
    const res = await apiClient.get<ApiResponse<CorridorAnalyticsData>>('/analytics/corridors')
    return res.data
  },

  /**
   * Historical Operational Trends
   */
  async getTrends(metric = 'availability', days = 30): Promise<ApiResponse<any>> {
    const res = await apiClient.get<ApiResponse<any>>('/analytics/trends', {
      params: { metric, days }
    })
    return res.data
  }
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const res = await analyticsService.getDashboard()
  return res.data
}

export async function getAssetAvailability(days = 7): Promise<any[]> {
  const res = await analyticsService.getTrends('availability', days)
  return res.data || []
}

export async function getMaintenancePriority(): Promise<any> {
  const res = await analyticsService.getMaintenanceAnalytics()
  const dist = res.data?.priority_distribution || []
  return {
    CRITICAL: dist.find((d: any) => d.priority === 'CRITICAL')?.count || 0,
    HIGH: dist.find((d: any) => d.priority === 'HIGH')?.count || 0,
    MEDIUM: dist.find((d: any) => d.priority === 'MEDIUM')?.count || 0,
    LOW: dist.find((d: any) => d.priority === 'LOW')?.count || 0,
  }
}

export async function getBlockUtilization(period = 'week'): Promise<any> {
  const res = await analyticsService.getBlockAnalytics({ start_date: period })
  return res.data
}

export async function getTrainDensity(): Promise<any[]> {
  const res = await analyticsService.getTrainImpactAnalytics()
  const raw = res.data as any
  return (raw?.hourly_density || raw?.train_density || []).map((h: any) => ({
    time_bucket: `${h.hour || 0}:00`,
    passenger_trains: h.passenger_trains || 0,
    freight_trains: h.freight_trains || 0,
  }))
}

export async function getCorridorStatus(): Promise<any[]> {
  const res = await analyticsService.getCorridorAnalytics()
  const raw = res.data as any
  return (raw?.corridor_rankings || raw?.corridors || []).map((c: any) => ({
    corridor_id: c.corridor_id || c.id,
    corridor_code: c.corridor_code || c.code,
    corridor_name: c.corridor_name || c.name,
    status: c.status || 'OPERATIONAL',
    asset_availability: c.asset_availability || c.availability || 98.2,
    total_assets: c.total_assets || c.asset_count || 120,
    critical_defects: c.critical_defects || 0,
    pending_maintenance: c.pending_maintenance || c.maintenance_count || 3,
    active_blocks: c.active_blocks || 1,
    train_density: c.train_density || 'MEDIUM',
  }))
}

export async function getAIInsights(): Promise<any[]> {
  const res = await analyticsService.getDashboard()
  const raw = res.data as any
  return (raw?.insights || []).map((ins: any, idx: number) => ({
    id: `ins-${idx}`,
    severity: ins.severity,
    category: ins.category,
    title: ins.title,
    message: ins.description,
    recommended_action: ins.recommendation,
  }))
}

export async function getDepartmentWorkload(): Promise<any[]> {
  const res = await analyticsService.getMaintenanceAnalytics()
  const raw = res.data as any
  return (raw?.department_workload || raw?.workload || []).map((d: any) => ({
    department_code: d.department_code || d.department || 'ENG',
    department_name: d.department_name || d.name || 'Engineering',
    task_count: d.total_tasks || d.task_count || 0,
    total_hours: d.total_hours || Math.round((d.total_tasks || 0) * 2.5),
  }))
}

export async function getOverdueMaintenance(): Promise<any[]> {
  const res = await analyticsService.getMaintenanceAnalytics()
  const raw = res.data as any
  return (raw?.department_workload || raw?.workload || []).map((d: any) => ({
    department_code: d.department_code || d.department || 'ENG',
    department_name: d.department_name || d.name || 'Engineering',
    overdue_count: d.overdue_tasks || d.overdue_count || 0,
  }))
}

