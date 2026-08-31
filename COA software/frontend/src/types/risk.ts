export interface RiskFactor {
  factor: string
  raw_value: number | string
  normalized_value: number
  weight: number
  contribution: number
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export interface RiskPrediction {
  id?: string
  asset_id: string
  asset_code: string
  asset_name?: string
  asset_type?: string
  department?: string
  corridor_id?: string
  horizon_days: number
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  failure_probability: number
  model: string
  model_version?: string
  recommendation: string
  explanation?: string
  factors: RiskFactor[]
  prediction_date?: string
}

export interface RiskHistoryItem {
  id: string
  asset_id: string
  prediction_date: string
  horizon_days: number
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  failure_probability: number
  model_name: string
  model_version: string
  recommendation?: string
  explanation?: string
  factors?: RiskFactor[]
}

export interface HighRiskAsset {
  id: string
  asset_id: string
  asset_code: string
  asset_name: string
  asset_type: string
  department: string
  corridor_id?: string
  health_score: number
  criticality_score: number
  risk_score: number
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  failure_probability: number
  horizon_days: number
  recommendation?: string
  explanation?: string
  factors: RiskFactor[]
  prediction_date?: string
}

export interface RiskSummary {
  critical_risk_count: number
  high_risk_count: number
  medium_risk_count: number
  low_risk_count: number
  total_predictions_monitored: number
  total_assets_count: number
  average_risk_score: number
  department_distribution: Record<string, Record<string, number>>
  risk_distribution: Record<string, number>
}
