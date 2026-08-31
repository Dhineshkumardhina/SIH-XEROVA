export interface OptimizationObjectiveWeights {
  asset_availability: number
  maintenance_priority: number
  train_impact: number
  block_utilization: number
}

export interface AIPlanningRequestPayload {
  planning_date: string
  horizon?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  corridor_ids?: string[]
  departments?: string[]
  max_block_duration_minutes?: number
  min_priority?: number
  include_overdue?: boolean
  include_critical?: boolean
  include_shared_blocks?: boolean
  optimization_objective?: OptimizationObjectiveWeights
}

export interface RecommendedBlock {
  block_id: string
  corridor_id: string
  corridor_name: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  departments: string[]
  is_shared_block: boolean
  tasks: Array<{
    task_id: string
    task_code: string
    department: string
    asset_id: string
    asset_name?: string
    priority: string
    duration_minutes: number
    is_overdue: boolean
    description?: string
  }>
  task_count: number
  critical_task_count: number
  affected_trains: any[]
  expected_train_delay: number
  maximum_train_delay: number
  asset_availability_gain: number
  block_utilization: number
  optimization_score: number
  confidence: number
  risk_level: string
  reason: string
  alternatives: any[]
  constraints_checked: string[]
  approval_status: string
}

export interface UnplannedTask {
  task_id: string
  task_code: string
  department: string
  priority: string
  reason: string
}

export interface PlanningSummary {
  planning_run_id: string
  planning_date: string
  planning_horizon: string
  corridors_analyzed: number
  tasks_analyzed: number
  tasks_selected: number
  tasks_unplanned: number
  critical_tasks_total: number
  critical_tasks_covered: number
  overdue_tasks_covered: number
  blocks_generated: number
  shared_blocks_generated: number
  departments_coordinated: number
  expected_train_delay_minutes: number
  optimization_score: number
  planning_confidence: number
  time_saved_minutes: number
  downtime_reduction_pct: number
  validation_status: string
  solver_duration_seconds: number
}

export interface PlanningExplanation {
  why_selected: string[]
  why_this_time?: string
  why_not_others: string[]
  overall_narrative: string[]
  validation_checks: string[]
}

export interface AIPlanningResultData {
  planning_run_id: string
  status: 'COMPLETED' | 'NO_FEASIBLE_PLAN' | 'FAILED' | string
  planning_date: string
  horizon: string
  corridor_id: string
  corridor_name: string
  summary: PlanningSummary
  recommended_blocks: RecommendedBlock[]
  unplanned_tasks: UnplannedTask[]
  plan_comparison: any
  alternatives: any[]
  explanation: PlanningExplanation
}
