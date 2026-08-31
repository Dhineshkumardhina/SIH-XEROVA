/**
 * RAILOPT AI — Real-Time WebSocket & Operations Types
 */

export type OperationEventType =
  | 'TRAIN_MOVEMENT'
  | 'TRAIN_DELAY'
  | 'BLOCK_CREATED'
  | 'BLOCK_ACTIVATED'
  | 'BLOCK_COMPLETED'
  | 'BLOCK_CONFLICT'
  | 'NEW_DEFECT'
  | 'CRITICAL_DEFECT'
  | 'MAINTENANCE_CREATED'
  | 'MAINTENANCE_OVERDUE'
  | 'MAINTENANCE_COMPLETED'
  | 'AI_RECOMMENDATION'
  | 'OPTIMIZATION_COMPLETED'
  | 'APPROVAL_PENDING'
  | 'BLOCK_APPROVED'
  | 'BLOCK_REJECTED'
  | 'SIMULATION_EVENT'
  | 'SYSTEM_ALERT'

export type EventSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL'

export interface OperationEvent {
  event_id: string
  event_type: OperationEventType
  severity: EventSeverity
  timestamp: string
  corridor_id?: string
  asset_id?: string
  message: string
  data: Record<string, any>
}

export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING'

export interface LiveTrainState {
  train_number: string
  train_name: string
  type: string
  current_station: string
  next_station: string
  speed_kmh: number
  delay_minutes: number
  status: 'ON_TIME' | 'DELAYED' | 'HELD'
  corridor_id: string
}

export interface ActiveBlockState {
  plan_code: string
  corridor_code: string
  start_time: string
  end_time: string
  departments: string[]
  status: 'ACTIVE' | 'PENDING' | 'CLEARING'
  train_impact_min: number
}
