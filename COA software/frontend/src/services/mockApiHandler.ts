/**
 * RAILOPT AI — Synthetic Offline / Demo API Response Handler
 * Automatically intercepts and serves rich railway operational datasets
 * whenever the remote backend server is offline or unreachable.
 */

export function getMockApiResponse(url: string, _method: string = 'get', _data?: any): any {
  const cleanUrl = url.split('?')[0].replace(/^\/api\/v1/, '').replace(/^\/+/, '')

  // 1. Dashboard & Analytics
  if (cleanUrl.startsWith('analytics/dashboard') || cleanUrl === 'dashboard/stats') {
    return {
      success: true,
      data: {
        asset_availability: 96.8,
        active_blocks: 3,
        critical_defects: 4,
        overdue_tasks: 7,
        total_corridors: 8,
        active_trains: 42,
        downtime_saved_hours: 14.5,
        conflict_reduction_pct: 100,
        availability_trend: [
          { name: 'Mon', availability: 95.2, target: 97 },
          { name: 'Tue', availability: 96.1, target: 97 },
          { name: 'Wed', availability: 94.8, target: 97 },
          { name: 'Thu', availability: 97.3, target: 97 },
          { name: 'Fri', availability: 96.8, target: 97 },
          { name: 'Sat', availability: 98.1, target: 97 },
          { name: 'Sun', availability: 97.5, target: 97 },
        ],
        department_workload: [
          { department: 'Civil Track (ENG)', active: 34, completed: 28, overdue: 4 },
          { department: 'Signaling & Telecom (SIG)', active: 21, completed: 19, overdue: 2 },
          { department: 'Electrical Traction (TRC)', active: 14, completed: 12, overdue: 1 },
          { department: 'Operating & Traffic (OPT)', active: 18, completed: 18, overdue: 0 },
        ],
        block_utilization: [
          { name: 'COR-A01 Delhi-Agra', planned: 240, actual: 210, efficiency: 87.5 },
          { name: 'COR-B02 Mumbai-Pune', planned: 270, actual: 245, efficiency: 90.7 },
          { name: 'COR-C03 Howrah-Kharagpur', planned: 150, actual: 148, efficiency: 98.7 },
          { name: 'COR-D04 Chennai-Arakkonam', planned: 180, actual: 120, efficiency: 66.7 },
        ],
      },
    }
  }

  // 2. Corridors
  if (cleanUrl.startsWith('corridors')) {
    const corridorList = [
      {
        id: 'cor-01',
        code: 'COR-A01',
        name: 'New Delhi – Agra Cantt High-Density Trunk',
        distance_km: 195.4,
        track_count: 2,
        electrified: true,
        status: 'OPERATIONAL',
        start_station_name: 'New Delhi (NDLS)',
        end_station_name: 'Agra Cantt (AGC)',
        total_assets: 48,
        active_blocks: 1,
        train_density: 'VERY_HIGH',
      },
      {
        id: 'cor-02',
        code: 'COR-B02',
        name: 'Mumbai Central – Ahmedabad Western Line',
        distance_km: 492.0,
        track_count: 4,
        electrified: true,
        status: 'OPERATIONAL',
        start_station_name: 'Mumbai Central (MMCT)',
        end_station_name: 'Ahmedabad (ADI)',
        total_assets: 94,
        active_blocks: 2,
        train_density: 'HIGH',
      },
      {
        id: 'cor-03',
        code: 'COR-C03',
        name: 'Howrah – Kharagpur South Eastern Trunk',
        distance_km: 115.8,
        track_count: 3,
        electrified: true,
        status: 'OPERATIONAL',
        start_station_name: 'Howrah (HWH)',
        end_station_name: 'Kharagpur (KGP)',
        total_assets: 36,
        active_blocks: 0,
        train_density: 'VERY_HIGH',
      },
      {
        id: 'cor-04',
        code: 'COR-D04',
        name: 'Chennai Central – Arakkonam Suburban Quad',
        distance_km: 68.5,
        track_count: 4,
        electrified: true,
        status: 'OPERATIONAL',
        start_station_name: 'MGR Chennai Central (MAS)',
        end_station_name: 'Arakkonam (AJJ)',
        total_assets: 29,
        active_blocks: 0,
        train_density: 'HIGH',
      },
    ]

    if (cleanUrl.includes('/availability')) {
      return {
        success: true,
        data: {
          corridor_id: 'cor-01',
          corridor_code: 'COR-A01',
          total_capacity_hours: 24,
          maintenance_window_hours: 4.5,
          train_occupation_hours: 17.5,
          buffer_hours: 2.0,
          windows: [
            { start_time: '2026-09-01T01:30:00Z', end_time: '2026-09-01T05:30:00Z', status: 'RECOMMENDED', traffic_level: 'LOW' },
            { start_time: '2026-09-01T13:00:00Z', end_time: '2026-09-01T15:00:00Z', status: 'AVAILABLE', traffic_level: 'MEDIUM' },
          ],
        },
      }
    }

    return {
      success: true,
      data: {
        items: corridorList,
        pagination: { total: corridorList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 3. Block Requests & Plans
  if (cleanUrl.startsWith('blocks')) {
    const blockList = [
      {
        id: 'blk-req-01',
        block_code: 'BLK-2026-001',
        corridor_id: 'cor-01',
        corridor_code: 'COR-A01',
        corridor_name: 'New Delhi – Agra Cantt',
        department_code: 'ENG',
        block_type: 'TRACK_MAINTENANCE',
        priority: 'CRITICAL',
        status: 'APPROVED',
        requested_start_time: '2026-09-01T01:30:00Z',
        requested_end_time: '2026-09-01T04:30:00Z',
        duration_minutes: 180,
        description: 'Deep screening & ballast tamping between Km 45.2 – 48.0',
        isolation_required: true,
        train_impact_count: 0,
        downtime_saved_minutes: 135,
      },
      {
        id: 'blk-req-02',
        block_code: 'BLK-2026-002',
        corridor_id: 'cor-01',
        corridor_code: 'COR-A01',
        corridor_name: 'New Delhi – Agra Cantt',
        department_code: 'SIG',
        block_type: 'SIGNAL_INTERLOCKING',
        priority: 'HIGH',
        status: 'PENDING_APPROVAL',
        requested_start_time: '2026-09-01T02:00:00Z',
        requested_end_time: '2026-09-01T04:00:00Z',
        duration_minutes: 120,
        description: 'Point machine renewal and electronic interlocking test at Station Bravo',
        isolation_required: false,
        train_impact_count: 1,
        downtime_saved_minutes: 90,
      },
      {
        id: 'blk-req-03',
        block_code: 'BLK-2026-003',
        corridor_id: 'cor-02',
        corridor_code: 'COR-B02',
        corridor_name: 'Mumbai Central – Ahmedabad',
        department_code: 'TRC',
        block_type: 'OHE_MAINTENANCE',
        priority: 'HIGH',
        status: 'SCHEDULED',
        requested_start_time: '2026-09-01T01:00:00Z',
        requested_end_time: '2026-09-01T03:30:00Z',
        duration_minutes: 150,
        description: 'OHE contact wire height adjustment & insulator washing',
        isolation_required: true,
        train_impact_count: 0,
        downtime_saved_minutes: 75,
      },
    ]

    return {
      success: true,
      data: {
        items: blockList,
        pagination: { total: blockList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 4. Trains & Timetables
  if (cleanUrl.startsWith('trains')) {
    const trainList = [
      {
        id: 'trn-01',
        train_number: '12002',
        train_name: 'Bhopal Shatabdi Express',
        train_type: 'SUPERFAST',
        default_direction: 'DOWN',
        origin: 'NDLS',
        destination: 'RKMP',
        priority: 1,
        status: 'ON_TIME',
        corridor_name: 'COR-A01 New Delhi-Agra',
        current_speed_kmh: 130,
        scheduled_arrival: '2026-09-01T06:00:00Z',
      },
      {
        id: 'trn-02',
        train_number: '22436',
        train_name: 'Vande Bharat Express',
        train_type: 'SUPERFAST',
        default_direction: 'UP',
        origin: 'BSB',
        destination: 'NDLS',
        priority: 1,
        status: 'ON_TIME',
        corridor_name: 'COR-A01 New Delhi-Agra',
        current_speed_kmh: 160,
        scheduled_arrival: '2026-09-01T14:00:00Z',
      },
      {
        id: 'trn-03',
        train_number: '12952',
        train_name: 'Mumbai Rajdhani Express',
        train_type: 'EXPRESS',
        default_direction: 'DOWN',
        origin: 'NDLS',
        destination: 'MMCT',
        priority: 1,
        status: 'ON_TIME',
        corridor_name: 'COR-B02 Mumbai-Ahmedabad',
        current_speed_kmh: 130,
        scheduled_arrival: '2026-09-01T16:55:00Z',
      },
      {
        id: 'trn-04',
        train_number: 'G-BOXN-401',
        train_name: 'Heavy Freight Coal Rake (BOXN)',
        train_type: 'GOODS',
        default_direction: 'DOWN',
        origin: 'DHN',
        destination: 'TKD',
        priority: 3,
        status: 'REGULATED',
        corridor_name: 'COR-A01 New Delhi-Agra',
        current_speed_kmh: 65,
        scheduled_arrival: '2026-09-01T03:00:00Z',
      },
    ]

    return {
      success: true,
      data: {
        items: trainList,
        pagination: { total: trainList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 5. Assets
  if (cleanUrl.startsWith('assets')) {
    const assetList = [
      {
        id: 'TRK-4582',
        asset_code: 'TRK-4582',
        name: 'Main Line Track Section A-B',
        asset_type: 'TRACK',
        department: { code: 'ENG', name: 'Civil Track' },
        health_score: 72.4,
        criticality_score: 85.0,
        status: 'ACTIVE',
        location: 'Km 45.2 – Km 68.9',
        corridor_code: 'COR-A01',
      },
      {
        id: 'OHE-245',
        asset_code: 'OHE-245',
        name: 'OHE Feeder Line #245',
        asset_type: 'TRACTION',
        department: { code: 'TRC', name: 'Electrical Traction' },
        health_score: 58.1,
        criticality_score: 92.0,
        status: 'ATTENTION_REQUIRED',
        location: 'Km 52.0 – Km 53.5',
        corridor_code: 'COR-A01',
      },
      {
        id: 'SIG-1201',
        asset_code: 'SIG-1201',
        name: 'Signal Relay Room North',
        asset_type: 'SIGNAL',
        department: { code: 'SIG', name: 'Signaling & Telecom' },
        health_score: 91.3,
        criticality_score: 78.0,
        status: 'ACTIVE',
        location: 'Station Alpha',
        corridor_code: 'COR-A01',
      },
      {
        id: 'BR-007',
        asset_code: 'BR-007',
        name: 'Bridge #7 – Yamuna River Crossing',
        asset_type: 'BRIDGE',
        department: { code: 'ENG', name: 'Civil Engineering' },
        health_score: 85.0,
        criticality_score: 65.0,
        status: 'ACTIVE',
        location: 'Km 61.0',
        corridor_code: 'COR-A01',
      },
    ]

    return {
      success: true,
      data: {
        items: assetList,
        pagination: { total: assetList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 6. Maintenance Tasks
  if (cleanUrl.startsWith('maintenance')) {
    const taskList = [
      {
        id: 'TSK-101',
        task_code: 'MT-001',
        description: 'Main Line Track Grinding – Section A-B',
        priority: 'CRITICAL',
        duration_minutes: 120,
        status: 'PLANNED',
        is_overdue: true,
        department: { code: 'ENG', name: 'Civil Track' },
        asset_name: 'Main Line Track Section A-B',
      },
      {
        id: 'TSK-102',
        task_code: 'MT-002',
        description: 'OHE Feeder Wire Replacement',
        priority: 'HIGH',
        duration_minutes: 90,
        status: 'PLANNED',
        is_overdue: true,
        department: { code: 'TRC', name: 'Electrical Traction' },
        asset_name: 'OHE Feeder Line #245',
      },
      {
        id: 'TSK-103',
        task_code: 'MT-003',
        description: 'Point Machine Renewal & Calibration',
        priority: 'CRITICAL',
        duration_minutes: 180,
        status: 'PLANNED',
        is_overdue: false,
        department: { code: 'SIG', name: 'Signaling & Telecom' },
        asset_name: 'Points & Crossings – Yard South',
      },
    ]

    return {
      success: true,
      data: {
        items: taskList,
        pagination: { total: taskList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 7. Defects
  if (cleanUrl.startsWith('defects')) {
    const defectList = [
      {
        id: 'def-01',
        defect_code: 'DEF-TRK-001',
        asset_id: 'TRK-4582',
        asset_name: 'Main Line Track Section A-B',
        severity: 'CRITICAL',
        status: 'OPEN',
        defect_type: 'WELD_CRACK',
        reported_at: '2026-08-30T10:15:00Z',
        location: 'Km 46.8 (Up Line)',
        tsr_required: true,
        speed_restriction_kmh: 30,
      },
      {
        id: 'def-02',
        defect_code: 'DEF-OHE-002',
        asset_id: 'OHE-245',
        asset_name: 'OHE Feeder Line #245',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        defect_type: 'INSULATOR_FLASH',
        reported_at: '2026-08-31T04:20:00Z',
        location: 'Km 52.4',
        tsr_required: false,
      },
    ]

    return {
      success: true,
      data: {
        items: defectList,
        pagination: { total: defectList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 8. AI & Optimization
  if (cleanUrl.startsWith('ai') || cleanUrl.startsWith('optimization') || cleanUrl.startsWith('planner')) {
    return {
      success: true,
      data: {
        optimization_run_id: 'OPT-2026-0901',
        status: 'OPTIMAL',
        corridor_code: 'COR-A01',
        baseline_duration_minutes: 270,
        optimized_duration_minutes: 180,
        downtime_saved_minutes: 90,
        efficiency_gain_pct: 33.3,
        conflicts_resolved: 4,
        recommended_windows: [
          {
            option_id: 'OPT-A',
            window_start: '2026-09-01T01:30:00Z',
            window_end: '2026-09-01T04:30:00Z',
            duration_minutes: 180,
            tasks_bundled: ['TSK-101', 'TSK-102', 'TSK-103'],
            departments: ['ENG', 'SIG', 'TRC'],
            train_delay_minutes: 0,
            reliability_score: 98.4,
          },
        ],
      },
    }
  }

  // 9. Simulation & Digital Twin
  if (cleanUrl.startsWith('simulation')) {
    return {
      success: true,
      data: {
        simulation_id: 'SIM-2026-01',
        status: 'COMPLETED',
        clock_speed: 1.0,
        train_movements: [
          { train_number: '12002', progress_pct: 64, speed_kmh: 130, signal_aspect: 'GREEN' },
          { train_number: '22436', progress_pct: 38, speed_kmh: 155, signal_aspect: 'DOUBLE_YELLOW' },
        ],
        metrics: {
          scheduled_trains: 24,
          delayed_trains: 0,
          average_delay_minutes: 0.0,
          network_throughput_pct: 99.2,
        },
      },
    }
  }

  // 10. Generic fallback response
  return {
    success: true,
    data: {
      items: [],
      pagination: { total: 0, page: 1, page_size: 10, total_pages: 1 },
      status: 'OK',
      timestamp: new Date().toISOString(),
    },
  }
}
