export type TrainImpactLevel = 'NO_IMPACT' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AffectedTrainDetail {
  train_id: string
  train_number: string
  train_name: string
  train_type: string
  direction: 'UP' | 'DOWN'
  scheduled_entry: string
  scheduled_exit: string
  overlap_minutes: number
  estimated_delay_minutes: number
  maximum_delay_minutes: number
  priority_label: string
  impact_level: TrainImpactLevel
  passengers_affected: number
  reason: string
}

export interface AlternativeWindow {
  start_time: string
  end_time: string
  start_datetime: string
  end_datetime: string
  duration_minutes: number
  affected_trains: number
  expected_delay_minutes: number
  impact_score: number
  impact_level: TrainImpactLevel
  feasible: boolean
  reason: string
}

export interface TrainImpactSummary {
  affected_trains: number
  expected_delay_minutes: number
  maximum_delay_minutes: number
  passenger_trains: number
  goods_trains: number
  express_trains: number
  superfast_trains: number
  special_trains: number
  maintenance_trains: number
  up_trains: number
  down_trains: number
  total_passengers_estimated: number
  highest_priority: string
  impact_score: number
  operational_impact: TrainImpactLevel
  is_acceptable: boolean
}

export interface TrainImpactData {
  corridor_id: string
  corridor_name?: string
  start_time: string
  end_time: string
  start_datetime: string
  end_datetime: string
  duration_minutes: number
  block_id?: string
  block_code?: string
  summary: TrainImpactSummary
  trains: AffectedTrainDetail[]
  explanation_bullets: string[]
  recommendation: string
  alternatives: AlternativeWindow[]
  method: string
}

export interface TrainImpactRequestPayload {
  corridor_id: string
  start_time: string // ISO string
  end_time: string   // ISO string
  block_type?: string
  isolation_required?: boolean
}
