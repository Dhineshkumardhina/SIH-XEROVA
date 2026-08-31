export type ConflictSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL'

export type ConflictType =
  | 'TRAIN_CONFLICT'
  | 'BLOCK_OVERLAP'
  | 'CORRIDOR_CONFLICT'
  | 'ISOLATION_CONFLICT'
  | 'DEPARTMENT_CONFLICT'
  | 'SAFETY_CONFLICT'
  | 'MAINTENANCE_CONFLICT'
  | 'CAPACITY_CONFLICT'
  | 'OPERATIONAL_BUFFER_CONFLICT'

export interface ConflictItem {
  conflict_type: ConflictType
  severity: ConflictSeverity
  entity_type?: string
  entity_id?: string
  entity_name?: string
  start_time?: string
  end_time?: string
  description: string
  resolution?: string
}

export interface BlockEvaluationData {
  corridor_id: string
  corridor_name?: string
  start_time: string
  end_time: string
  start_datetime: string
  end_datetime: string
  duration_minutes: number
  feasible: boolean
  severity: ConflictSeverity
  conflict_count: number
  critical_conflicts_count: number
  conflicts: ConflictItem[]
  resolution_suggestions: string[]
  affected_trains: any[]
  train_impact: any
  alternatives: any[]
  shared_block_possible: boolean
}

export interface BlockEvaluationPayload {
  corridor_id: string
  start_time: string
  end_time: string
  task_ids?: string[]
  isolation_required?: boolean
  exclude_block_id?: string
}

export interface FeasibleWindowItem {
  start_time: string
  end_time: string
  start_datetime: string
  end_datetime: string
  duration_minutes: number
  impact_score: number
  expected_delay_minutes: number
  conflict_count: number
  severity: ConflictSeverity
  feasible: boolean
  reason: string
}

export interface FeasibleWindowsPayload {
  corridor_id: string
  date: string
  duration_minutes?: number
  preferred_start_hour?: number
  preferred_end_hour?: number
  task_ids?: string[]
}
