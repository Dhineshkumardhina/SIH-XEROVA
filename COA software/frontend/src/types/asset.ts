export interface Asset {
  id: string
  asset_code?: string
  asset_type?: string
  department_id?: string
  department?: string
  name: string
  description?: string | null
  station_id?: string | null
  corridor_id?: string | null
  location?: string
  latitude?: number | null
  longitude?: number | null
  criticality?: string
  criticality_score?: number
  health_score: number
  status?: string
  last_maintained?: string | null
  last_inspection_at?: string | null
  next_inspection_at?: string | null
  commission_date?: string | null
  installation_date?: string | null
  created_at?: string
  updated_at?: string
}

export interface AssetHealth {
  id: string
  asset_id: string
  health_score: number
  condition_score: number
  failure_count: number
  defect_count: number
  recorded_at: string
}

export interface AssetRisk {
  asset_id: string
  asset_code: string
  asset_name: string
  risk_score: number
  health_score: number
  criticality_score: number
  criticality_tier: string
  recommended_action: string
}
