export interface AuditLog {
  id: string
  user_id?: string | null
  username?: string | null
  action: string
  entity_type: string
  entity_id: string
  old_value?: Record<string, unknown> | null
  new_value?: Record<string, unknown> | null
  description?: string | null
  ip_address?: string | null
  created_at: string
}
