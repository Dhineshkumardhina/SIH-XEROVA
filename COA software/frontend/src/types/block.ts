export type BlockStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'AI_ANALYZED'
  | 'EXECUTED'
  | 'RECOMMENDED'

export interface BlockRequest {
  id: string
  request_code: string
  department_id: string
  department?: string
  asset_id?: string | null
  corridor_id: string
  requested_date?: string | null
  preferred_start_at: string
  preferred_end_at: string
  duration_minutes: number
  block_type: string
  isolation_required: boolean
  reason: string
  priority: string
  status: BlockStatus | string
  requested_by?: string
  created_at: string
  updated_at: string
}

export interface BlockPlan {
  id: string
  plan_code?: string
  corridor_id?: string
  corridor?: string
  start_time?: string
  end_time?: string
  planned_start_at?: string
  planned_end_at?: string
  duration_minutes?: number
  status?: BlockStatus | string
  tasks_included?: string[] | number
  departments?: string[]
  train_impact?: number
  expected_delay_minutes?: number
  downtime_saved_minutes?: number
  optimization_score?: number
  confidence_score?: number
  ai_reason?: string
  approved_by?: string | null
  approved_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface BlockConflict {
  id: string
  block_plan_id: string
  conflict_type: string
  severity: string
  description: string
  resolution_strategy?: string | null
  detected_at: string
}

export interface BlockImpact {
  block_id: string
  corridor_id: string
  duration_minutes: number
  train_delay_minutes: number
  trains_affected_count: number
  passengers_impacted_estimate: number
  freight_delay_hours: number
  asset_availability_gain: number
  safety_score: number
}
