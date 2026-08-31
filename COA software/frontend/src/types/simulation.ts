export interface ScenarioItem {
  scenario_id: string
  name: string
  description: string
  difficulty: string
  train_count: number
  block_count: number
}

export interface StationNode {
  station_id: string
  code: string
  name: string
  km_post: number
  tracks_count: number
  x_coord: number
  y_coord: number
}

export interface TrackSegment {
  segment_id: string
  from_station_id: string
  to_station_id: string
  length_km: number
  max_speed_kmh: number
  electrified: boolean
  is_blocked: boolean
  active_block_id?: string
}

export interface SimulatedTrain {
  train_id: string
  train_number: string
  train_type: string
  direction: string
  origin: string
  destination: string
  current_station?: string
  current_section?: string
  progress_pct: number
  speed_kmh: number
  scheduled_departure: string
  scheduled_arrival: string
  actual_departure?: string
  actual_arrival?: string
  delay_minutes: number
  status: string
}

export interface SimulatedTask {
  task_id: string
  task_code: string
  department: string
  asset_id: string
  asset_name: string
  duration_minutes: number
  progress_pct: number
  status: string
}

export interface SimulatedBlock {
  block_id: string
  corridor_id: string
  section_code: string
  start_time: string
  end_time: string
  duration_minutes: number
  departments: string[]
  is_shared: boolean
  status: string
  tasks: SimulatedTask[]
}

export interface SimulationEvent {
  event_id: string
  event_type: string
  simulation_time: string
  title: string
  description: string
  severity: string
}

export interface SimulationMetrics {
  active_trains: number
  completed_trains: number
  delayed_trains: number
  total_train_delay_minutes: number
  active_blocks: number
  completed_blocks: number
  active_maintenance_tasks: number
  completed_maintenance_tasks: number
  conflicts_detected: number
  conflicts_resolved: number
  asset_availability_pct: number
  block_utilization_pct: number
}

export interface SimulationState {
  simulation_id: string
  scenario_id: string
  scenario_name: string
  simulation_date: string
  simulation_time_minutes: number
  simulation_time_str: string
  status: 'INITIALIZING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'RESET'
  speed_multiplier: number
  plan_mode: 'MANUAL_BASELINE' | 'AI_OPTIMIZED'
  network_stations: StationNode[]
  track_segments: TrackSegment[]
  trains: SimulatedTrain[]
  blocks: SimulatedBlock[]
  events: SimulationEvent[]
  metrics: SimulationMetrics
  plan_comparison: any
}
