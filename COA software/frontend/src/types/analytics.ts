/**
 * RAILOPT AI — Analytics Types
 * TypeScript interfaces for all Operations Analytics & Performance Intelligence data.
 */

export interface DashboardKPIs {
  asset_availability: {
    availability_pct: number
    total_assets: number
    healthy_assets: number
    degraded_assets: number
    formula: string
  }
  block_utilization: {
    utilization_pct: number
    allocated_minutes: number
    used_minutes: number
    active_blocks: number
    formula: string
  }
  maintenance: {
    total_tasks: number
    completed_tasks: number
    completion_rate_pct: number
    total_overdue: number
    critical_overdue: number
    overdue_reduction_pct: number
  }
  train_impact: {
    affected_trains: number
    total_delay_minutes: number
    avg_delay_minutes: number
    max_delay_minutes: number
  }
  shared_blocks: {
    total_shared_blocks: number
    tasks_consolidated: number
    departments_coordinated: number
    hours_saved: number
    downtime_reduction_pct: number
  }
  insights: Array<{
    severity: 'CRITICAL' | 'HIGH' | 'WARNING' | 'MEDIUM' | 'INFO'
    category: string
    title: string
    description: string
    recommendation: string
  }>
}

export interface AssetAvailabilityPoint {
  date: string
  availability: number
}

export interface MaintenancePriorityData {
  CRITICAL: number
  HIGH: number
  MEDIUM: number
  LOW: number
}

export interface TrainDensityPoint {
  time_bucket: string
  passenger_trains: number
  freight_trains: number
}

export interface CorridorStatusData {
  corridor_id: string
  corridor_code: string
  corridor_name: string
  status: string
  asset_availability: number
  total_assets: number
  critical_defects: number
  pending_maintenance: number
  active_blocks: number
  train_density: string
}

export interface AIInsight {
  id: string
  severity: string
  category: string
  title: string
  message: string
  recommended_action: string
}

export interface DepartmentWorkloadData {
  department_code: string
  department_name: string
  task_count: number
  total_hours: number
}

export interface OverdueDeptData {
  department_code: string
  department_name: string
  overdue_count: number
}

export interface AssetAnalyticsData {
  kpis: {
    total_assets: number
    healthy: number
    monitor: number
    degraded: number
    critical: number
    out_of_service: number
    avg_health_score: number
    avg_criticality: number
  }
  health_distribution: Array<{
    status: string
    count: number
    color: string
  }>
  department_analytics: Array<{
    department_code: string
    department_name: string
    asset_count: number
    avg_health_score: number
    critical_assets: number
    open_defects: number
  }>
  critical_assets: Array<{
    asset_id: string
    asset_code: string
    asset_type: string
    department_code: string
    corridor_code: string
    health_score: number
    criticality: number
    status: string
    open_defects: number
    risk_score: number
    next_maintenance: string
  }>
}

export interface MaintenanceAnalyticsData {
  kpis: {
    total_tasks: number
    completed: number
    pending: number
    in_progress: number
    overdue: number
    critical: number
    completion_rate_pct: number
    avg_duration_minutes: number
  }
  status_distribution: Array<{
    status: string
    count: number
    color: string
  }>
  priority_distribution: Array<{
    priority: string
    count: number
    color: string
  }>
  workload_by_department: Array<{
    department_code: string
    department_name: string
    total_tasks: number
    completed: number
    overdue: number
    critical: number
  }>
  overdue_table: Array<{
    task_id: string
    task_code: string
    description: string
    asset_code: string
    department_code: string
    corridor_code: string
    due_date: string
    overdue_days: number
    priority: string
    risk_score: number
  }>
}

export interface BlockAnalyticsData {
  kpis: {
    total_blocks: number
    approved: number
    completed: number
    conflicts: number
    shared_blocks: number
    avg_duration_minutes: number
    block_utilization_pct: number
  }
  duration_analysis: {
    avg_duration_minutes: number
    min_duration_minutes: number
    max_duration_minutes: number
    median_duration_minutes: number
  }
  shared_blocks_summary: {
    shared_blocks: number
    tasks_consolidated: number
    departments_coordinated: number
    hours_saved: number
    downtime_reduction_pct: number
  }
  utilization_trend: Array<{
    day: string
    allocated_minutes: number
    actual_minutes: number
    utilization_pct: number
  }>
  before_vs_after: {
    manual_plan: {
      block_occupation_minutes: number
      train_delay_minutes: number
      block_utilization_pct: number
      tasks_completed: number
      shared_blocks: number
    }
    ai_optimized: {
      block_occupation_minutes: number
      train_delay_minutes: number
      block_utilization_pct: number
      tasks_completed: number
      shared_blocks: number
    }
    savings: {
      time_saved_minutes: number
      downtime_reduction_pct: number
      delay_avoided_minutes: number
    }
  }
}

export interface TrainImpactAnalyticsData {
  kpis: {
    affected_trains: number
    total_delay_minutes: number
    avg_delay_minutes: number
    max_delay_minutes: number
    passenger_affected: number
    goods_affected: number
  }
  impact_by_type: Array<{
    train_type: string
    affected_trains: number
    total_delay_minutes: number
    avg_delay: number
    color: string
  }>
  delay_trend: Array<{
    date: string
    total_delay: number
    avg_delay: number
  }>
}

export interface CorridorPerformanceItem {
  corridor_id: string
  corridor_code: string
  corridor_name: string
  asset_availability_pct: number
  total_assets: number
  critical_assets: number
  critical_defects: number
  overdue_tasks: number
  active_blocks: number
  block_utilization_pct: number
  risk_score: number
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface CorridorAnalyticsData {
  formula: string
  corridors: CorridorPerformanceItem[]
}
