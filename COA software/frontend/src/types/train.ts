export interface Train {
  id: string
  train_number: string
  train_name: string
  train_type: string
  default_direction: string
  origin: string
  destination: string
  priority: number
  status: string
  corridor_id?: string
  is_goods_train?: boolean
  is_passenger_train?: boolean
  max_speed_kmh?: number
  length_meters?: number
  created_at?: string
}

export interface TrainSchedule {
  id: string
  train_id: string
  train?: Train
  corridor_id: string
  station_id: string
  stop_sequence?: number
  scheduled_date: string
  arrival_time: string
  departure_time: string
  dwell_minutes: number
  halt_duration_minutes?: number
  platform?: string | null
}

export interface TrainMovement {
  id: string
  train_id: string
  train?: Train
  corridor_id: string
  station_id?: string | null
  event_time: string
  event_type: string
  status: string
  delay_minutes: number
  location_km?: number | null
}

export interface GoodsForecast {
  id: string
  corridor_id: string
  forecast_date: string
  hour_start: number
  hour_end: number
  expected_goods_trains: number
  traffic_density: string
  movement_probability: number
  model_version?: string
}

export interface TrainDensity {
  train_count: number
  passenger_count: number
  goods_count: number
  total_movements: number
  traffic_density: string
}

export interface TrainImpact {
  affected_trains: Partial<Train>[]
  affected_train_count: number
  passenger_trains: number
  goods_trains: number
  estimated_delay_minutes: number
  maximum_delay_minutes: number
  impact_level: string
  method: string
}
