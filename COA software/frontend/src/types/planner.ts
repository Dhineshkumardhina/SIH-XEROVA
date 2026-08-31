export interface DailyTimelineEvent {
  type: 'TRAIN' | 'AI_BLOCK' | 'APPROVED_BLOCK' | 'AVAILABLE_WINDOW' | 'CONFLICT'
  title: string
  start_time: string
  end_time: string
  status: string
  plan_id?: string
}

export interface CorridorTimelineRow {
  corridor_id: string
  corridor_code: string
  corridor_name: string
  events: DailyTimelineEvent[]
}

export interface DailyTimelineData {
  hours: string[]
  corridors: CorridorTimelineRow[]
}

export interface DailyPlanResult {
  planning_id: string
  planning_date: string
  corridor_id: string
  corridor_name: string
  status: string
  summary: any
  recommended_blocks: any[]
  timeline: DailyTimelineData
  unplanned_tasks: any[]
  plan_comparison: any
  explanation: any
}

export interface WeeklyDayData {
  day_index: number
  day_name: string
  date: string
  tasks_count: number
  critical_tasks_count: number
  blocks_count: number
  expected_train_delay: number
  block_utilization_pct: number
  status: string
}

export interface WeeklyPlanResult {
  weekly_plan_id: string
  status: string
  start_date: string
  end_date: string
  summary: {
    weekly_plan_id: string
    start_date: string
    end_date: string
    total_tasks_scheduled: number
    critical_tasks_covered: number
    overdue_reduction_pct: number
    total_blocks_planned: number
    shared_blocks_count: number
    average_block_utilization_pct: number
    total_expected_train_delay_minutes: number
    asset_availability_gain_pct: number
    optimization_score: number
  }
  days: WeeklyDayData[]
  plan_comparison: any
}

export interface MonthlyWeekData {
  week_number: number
  start_date: string
  end_date: string
  tasks_quota: number
  critical_tasks_scheduled: number
  blocks_planned: number
  utilization_pct: number
  status: string
}

export interface MonthlyPlanResult {
  monthly_plan_id: string
  year: number
  month: number
  status: string
  summary: {
    total_tasks_scheduled: number
    total_blocks_planned: number
    shared_blocks_planned: number
    expected_overdue_reduction_pct: number
    average_utilization_pct: number
    expected_asset_availability_pct: number
    optimization_score: number
  }
  weeks: MonthlyWeekData[]
  department_workload: Array<{
    department: string
    tasks_count: number
    quota_pct: number
  }>
}

export interface BlockMovePayload {
  new_start_time: string
  new_end_time: string
  change_reason?: string
}

export interface PlanPublishResult {
  success: boolean
  plan_id: string
  plan_code: string
  status: string
  published_at: string
  published_by: string
  message: string
}
