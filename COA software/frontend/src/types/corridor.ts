export interface Corridor {
  id: string
  code: string
  name: string
  start_station_id: string
  end_station_id: string
  distance_km: number
  track_count: number
  electrified: boolean
  status: string
  geometry?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface CorridorAvailability {
  corridor_id: string
  corridor_code: string
  corridor_name: string
  status: string
  availability_pct: number
  active_blocks_count: number
  open_defects_count: number
  pending_tasks_count: number
  scheduled_trains_count: number
}
