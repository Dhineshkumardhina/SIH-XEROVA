export interface ScenarioParameters {
  base_plan_id?: string
  base_plan_version?: number
  corridor_id?: string
  block_start: string
  block_duration_minutes: number
  block_end?: string
  passenger_traffic_multiplier: number
  goods_forecast_rate: number
  selected_tasks: string[]
  task_duration_overrides: Record<string, number>
  task_priority_overrides: Record<string, number>
  available_window_start?: string
  available_window_end?: string
}

export interface KpiDelta {
  baseline: number
  scenario: number
  diff: number
  pct_change: number
  status: 'IMPROVED' | 'UNCHANGED' | 'WORSE' | 'CRITICAL'
}

export interface ScenarioExplanation {
  what_changed: string
  what_happened: string
  why: string[]
  recommendation: string
}

export interface AlternativeRecommendation {
  window: string
  corridor_id: string
  expected_train_delay: number
  conflicts: number
  savings_vs_scenario: {
    delay_reduced_minutes: number
    score_improvement: number
  }
  rationale: string
}

export interface ScenarioResult {
  scenario_id: string
  status: string
  executed_at: string
  baseline_metrics: Record<string, any>
  scenario_metrics: Record<string, any>
  deltas: Record<string, KpiDelta>
  explanation: ScenarioExplanation
  alternative_recommendation?: AlternativeRecommendation | null
  score: number
}

export interface SimulationScenarioItem {
  id: string
  name: string
  description?: string
  scenario_type: string
  configuration?: {
    base_plan_id?: string
    base_plan_version?: number
    parameters: ScenarioParameters
    baseline_metrics?: Record<string, any>
    status: 'DRAFT' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    results?: ScenarioResult | null
  }
  created_by?: string
  created_at?: string
  updated_at?: string
}
