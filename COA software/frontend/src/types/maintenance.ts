export type Priority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface MaintenanceTask {
  id: string
  task_code?: string
  asset_id: string
  department_id?: string
  department?: string
  task_type?: string
  description: string
  scheduled_start_at?: string | null
  scheduled_date?: string | null
  due_at?: string | null
  due_date?: string | null
  duration_minutes: number
  priority: Priority | string
  urgency?: number
  safety_impact?: number
  train_impact?: number
  block_required?: boolean
  isolation_required?: boolean
  is_overdue: boolean
  overdue_days?: number
  status?: string
  created_at?: string
  updated_at?: string
}

export interface MaintenanceHistory {
  id: string
  maintenance_task_id: string
  asset_id: string
  performed_by?: string | null
  status: string
  event_type: string
  completed_at?: string | null
  remarks?: string | null
  result?: string | null
}
