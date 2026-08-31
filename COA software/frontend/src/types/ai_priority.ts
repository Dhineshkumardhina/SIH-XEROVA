export interface AIPriorityFactor {
  raw_value: number
  normalized_value: number
  weight: number
  contribution: number
}

export interface AIPriorityPrediction {
  id: string
  task_id: string
  priority_score: number
  priority_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  model_name: string
  model_version: string
  factor_breakdown: Record<string, AIPriorityFactor>
  recommendation?: string
  explanation?: string
  created_at: string
  updated_at: string
}
