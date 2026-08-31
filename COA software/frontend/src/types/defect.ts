export interface Defect {
  id: string
  defect_code: string
  asset_id: string
  department_id: string
  department?: string
  description: string
  severity: string
  detected_at?: string
  detected_date?: string
  detected_by?: string
  risk_score: number
  safety_impact: number
  operational_impact: number
  status: string
  target_resolution_date?: string | null
  resolved_at?: string | null
  assigned_to?: string | null
  resolved_by?: string | null
  resolution_notes?: string | null
  created_at: string
  updated_at: string
}
