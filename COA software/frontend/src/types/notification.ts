export interface Notification {
  id: string
  user_id?: string | null
  title: string
  message: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'
  entity_type?: string | null
  entity_id?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
}

export type NotificationResponse = Notification
