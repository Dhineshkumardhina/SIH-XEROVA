export interface OptimizationRequestPayload {
  planning_date: string
  corridor_id: string
  task_ids?: string[]
  planning_horizon?: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  maximum_block_duration_minutes?: number
  minimum_block_duration_minutes?: number
  weight_maintenance_priority?: number
  weight_asset_availability?: number
  weight_shared_block?: number
  weight_train_delay?: number
}

export interface ScheduledTaskItem {
  task_id: string
  task_code: string
  department: string
  asset_id: string
  asset_name?: string
  priority: string
  duration_minutes: number
  is_overdue: boolean
  description?: string
}

export interface BlockExplanation {
  why_selected: string[]
  why_this_time?: string
  why_not_others: string[]
  departments: string[]
  is_shared_block: boolean
  time_saved_vs_sequential_minutes: number
  utilization_pct: number
}

export interface OptimizationBlock {
  block_id: string
  corridor_id: string
  corridor_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  departments: string[]
  is_shared_block: boolean
  tasks: ScheduledTaskItem[]
  task_count: number
  maintenance_minutes: number
  block_utilization: number
  train_impact_score: number
  expected_delay_minutes: number
  affected_trains_count: number
  asset_availability_gain: number
  optimization_score: number
  conflicts: any[]
  explanation: BlockExplanation
}

export interface UnscheduledTask {
  task_id: string
  task_code: string
  department_code: string
  priority: string
  reason: string
}

export interface PlanComparison {
  baseline: {
    total_duration_minutes: number
    number_of_blocks: number
    is_shared: boolean
  }
  optimized: {
    total_duration_minutes: number
    number_of_blocks: number
    is_shared: boolean
  }
  savings: {
    time_saved_minutes: number
    downtime_reduction_pct: number
    blocks_consolidated: number
  }
}

export interface OptimizationAlternative {
  start_time: string
  end_time: string
  duration_minutes: number
  score: number
  train_impact_score: number
  expected_delay_minutes: number
  affected_trains: number
  reason: string
}

export interface OptimizationResultData {
  optimization_run_id: string
  status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'UNKNOWN'
  planning_horizon: string
  planning_date: string
  corridor_id: string
  corridor_name: string
  solver_duration_seconds: number
  objective_value: number
  blocks: OptimizationBlock[]
  unscheduled_tasks: UnscheduledTask[]
  metrics: Record<string, any>
  baseline_plan: Record<string, any>
  plan_comparison: PlanComparison
  alternatives: OptimizationAlternative[]
  explanations: string[]
}
