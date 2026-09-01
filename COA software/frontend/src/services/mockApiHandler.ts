/**
 * RAILOPT AI — Synthetic Offline / Demo API Response Handler
 * Automatically intercepts and serves rich railway operational datasets
 * whenever the remote backend server is offline, unreachable, or in demo mode.
 */

export function getMockApiResponse(url: string, _method: string = 'get', _data?: any): any {
  // Strip protocol, host, and /api/v1 prefix safely
  const cleanUrl = url
    .split('?')[0]
    .replace(/^https?:\/\/[^\/]+/, '')
    .replace(/^\/api\/v1\/?/, '')
    .replace(/^\/+/, '')

  // 1. Dashboard & Operations Analytics
  if (cleanUrl.startsWith('analytics/dashboard') || cleanUrl === 'dashboard/stats') {
    return {
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: {
        asset_availability: {
          availability_pct: 96.8,
          total_assets: 120,
          healthy_assets: 116,
          degraded_assets: 4,
          formula: 'healthy_assets / total_assets * 100',
        },
        block_utilization: {
          utilization_pct: 89.2,
          allocated_minutes: 840,
          used_minutes: 723,
          active_blocks: 3,
          formula: 'actual_maintenance_duration / allocated_block_duration * 100',
        },
        maintenance: {
          total_tasks: 45,
          completed_tasks: 38,
          completion_rate_pct: 84.4,
          total_overdue: 3,
          critical_overdue: 1,
          overdue_reduction_pct: 24.5,
        },
        train_impact: {
          affected_trains: 3,
          total_delay_minutes: 18.0,
          avg_delay_minutes: 6.0,
          max_delay_minutes: 18.0,
        },
        shared_blocks: {
          total_shared_blocks: 3,
          tasks_consolidated: 12,
          departments_coordinated: 3,
          hours_saved: 3.8,
          downtime_reduction_pct: 52.4,
        },
        insights: [
          {
            severity: 'CRITICAL',
            category: 'MAINTENANCE',
            title: 'Critical Track & Signal Maintenance Required',
            description: 'Track section Km 45.2–48.0 requires urgent tamping and point machine inspection.',
            recommendation: 'Bundle ENG and SIG tasks into upcoming Night Window #3.',
          },
          {
            severity: 'HIGH',
            category: 'COORDINATION',
            title: 'Cross-Department Shadow Possession Opportunity',
            description: 'OHE maintenance on Feeder Line #245 coincides with Track Grinding on COR-A01.',
            recommendation: 'Coordinate joint block window to save 90 minutes total corridor downtime.',
          },
          {
            severity: 'INFO',
            category: 'NETWORK',
            title: 'Optimal Punctuality on New Delhi – Agra Corridor',
            description: 'Current asset availability stands at 96.8% with zero major timetable conflicts.',
            recommendation: 'Maintain standard preventive inspection schedule.',
          },
        ],
      },
    }
  }

  // 1b. Trends Analytics
  if (cleanUrl.startsWith('analytics/trends')) {
    return {
      success: true,
      message: 'Trend analytics retrieved successfully',
      data: [
        { date: '2026-08-26', availability: 95.2, target: 97.0 },
        { date: '2026-08-27', availability: 96.1, target: 97.0 },
        { date: '2026-08-28', availability: 94.8, target: 97.0 },
        { date: '2026-08-29', availability: 97.3, target: 97.0 },
        { date: '2026-08-30', availability: 96.8, target: 97.0 },
        { date: '2026-08-31', availability: 98.1, target: 97.0 },
        { date: '2026-09-01', availability: 96.8, target: 97.0 },
      ],
    }
  }

  // 1c. Asset Analytics
  if (cleanUrl.startsWith('analytics/assets')) {
    return {
      success: true,
      data: {
        kpis: {
          total_assets: 120,
          healthy_assets: 116,
          monitor_assets: 2,
          degraded_assets: 2,
          critical_assets: 0,
          average_health_score: 88.4,
          asset_availability_pct: 96.8,
        },
        health_distribution: [
          { score_range: '90-100 (Optimal)', count: 82 },
          { score_range: '75-89 (Good)', count: 34 },
          { score_range: '60-74 (Monitor)', count: 3 },
          { score_range: '<60 (Degraded)', count: 1 },
        ],
        department_analytics: [
          { department_code: 'ENG', total_assets: 54, healthy_count: 51, degraded_count: 3, avg_health: 86.2 },
          { department_code: 'SIG', total_assets: 38, healthy_count: 37, degraded_count: 1, avg_health: 91.5 },
          { department_code: 'TRC', total_assets: 28, healthy_count: 28, degraded_count: 0, avg_health: 94.0 },
        ],
        critical_assets: [
          { id: 'TRK-4582', asset_code: 'TRK-4582', name: 'Main Line Track Section A-B', health_score: 58.2, criticality_score: 85.0 },
          { id: 'OHE-245', asset_code: 'OHE-245', name: 'OHE Feeder Line #245', health_score: 62.4, criticality_score: 92.0 },
        ],
      },
    }
  }

  // 1d. Maintenance Analytics
  if (cleanUrl.startsWith('analytics/maintenance')) {
    return {
      success: true,
      data: {
        kpis: {
          total_tasks: 45,
          completed_tasks: 38,
          completion_rate_pct: 84.4,
          total_overdue: 3,
          critical_overdue: 1,
        },
        priority_distribution: [
          { priority: 'CRITICAL', count: 4 },
          { priority: 'HIGH', count: 12 },
          { priority: 'MEDIUM', count: 21 },
          { priority: 'LOW', count: 8 },
        ],
        status_distribution: [
          { status: 'COMPLETED', count: 38 },
          { status: 'PLANNED', count: 4 },
          { status: 'IN_PROGRESS', count: 3 },
        ],
        workload_by_department: [
          { department_code: 'ENG', department_name: 'Civil Track', total_tasks: 18, overdue_tasks: 2, completion_rate: 82.0 },
          { department_code: 'SIG', department_name: 'Signaling & Telecom', total_tasks: 15, overdue_tasks: 1, completion_rate: 88.0 },
          { department_code: 'TRC', department_name: 'Electrical Traction', total_tasks: 12, overdue_tasks: 0, completion_rate: 91.5 },
        ],
        department_workload: [
          { department_code: 'ENG', department_name: 'Civil Track', task_count: 18, overdue_count: 2, total_hours: 45 },
          { department_code: 'SIG', department_name: 'Signaling & Telecom', task_count: 15, overdue_count: 1, total_hours: 32 },
          { department_code: 'TRC', department_name: 'Electrical Traction', task_count: 12, overdue_count: 0, total_hours: 24 },
        ],
        overdue_table: [
          { task_id: 'TSK-101', task_code: 'MT-001', department_code: 'ENG', department_name: 'Civil Track', overdue_count: 2 },
          { task_id: 'TSK-102', task_code: 'MT-002', department_code: 'SIG', department_name: 'Signaling & Telecom', overdue_count: 1 },
        ],
      },
    }
  }

  // 1e. Block Analytics
  if (cleanUrl.startsWith('analytics/blocks')) {
    return {
      success: true,
      data: {
        kpis: {
          utilization_pct: 89.2,
          allocated_minutes: 840,
          used_minutes: 723,
          active_blocks: 3,
        },
        duration_analysis: {
          allocated_minutes: 840,
          used_minutes: 723,
          efficiency: 86.1,
        },
        shared_blocks_summary: {
          total_shared: 3,
          hours_saved: 3.8,
          departments: 3,
        },
        utilization_trend: [
          { day: 'Mon', planned: 240, actual: 210 },
          { day: 'Tue', planned: 270, actual: 245 },
          { day: 'Wed', planned: 180, actual: 170 },
          { day: 'Thu', planned: 150, actual: 148 },
        ],
        before_vs_after: {
          isolated_downtime_hours: 4.5,
          shared_downtime_hours: 2.0,
          savings_minutes: 150,
        },
      },
    }
  }

  // 1f. Train Impact Analytics
  if (cleanUrl.startsWith('analytics/train-impact')) {
    return {
      success: true,
      data: {
        kpis: {
          affected_trains: 3,
          total_delay_minutes: 18.0,
          avg_delay_minutes: 6.0,
          max_delay_minutes: 18.0,
        },
        impact_by_type: [
          { type: 'SUPERFAST', affected: 1, delay: 5.0 },
          { type: 'EXPRESS', affected: 1, delay: 8.0 },
          { type: 'GOODS', affected: 1, delay: 5.0 },
        ],
        hourly_density: [
          { hour: 0, passenger_trains: 2, freight_trains: 4 },
          { hour: 4, passenger_trains: 6, freight_trains: 3 },
          { hour: 8, passenger_trains: 14, freight_trains: 2 },
          { hour: 12, passenger_trains: 11, freight_trains: 3 },
          { hour: 16, passenger_trains: 16, freight_trains: 2 },
          { hour: 20, passenger_trains: 12, freight_trains: 4 },
        ],
      },
    }
  }

  // 1g. Corridor Analytics
  if (cleanUrl.startsWith('analytics/corridors')) {
    return {
      success: true,
      data: {
        formula: '(availability_score * 0.4) + (punctuality_score * 0.4) + (defect_score * 0.2)',
        corridor_rankings: [
          {
            corridor_id: 'cor-01',
            corridor_code: 'COR-A01',
            corridor_name: 'New Delhi – Agra Cantt High-Density Trunk',
            status: 'NORMAL',
            asset_availability: 96.8,
            total_assets: 48,
            critical_defects: 1,
            pending_maintenance: 3,
            active_blocks: 1,
            train_density: 'HIGH',
          },
          {
            corridor_id: 'cor-02',
            corridor_code: 'COR-B02',
            corridor_name: 'Mumbai Central – Ahmedabad Western Line',
            status: 'NORMAL',
            asset_availability: 97.4,
            total_assets: 94,
            critical_defects: 0,
            pending_maintenance: 2,
            active_blocks: 2,
            train_density: 'VERY_HIGH',
          },
          {
            corridor_id: 'cor-03',
            corridor_code: 'COR-C03',
            corridor_name: 'Howrah – Kharagpur South Eastern Trunk',
            status: 'ATTENTION',
            asset_availability: 94.2,
            total_assets: 36,
            critical_defects: 2,
            pending_maintenance: 4,
            active_blocks: 0,
            train_density: 'VERY_HIGH',
          },
          {
            corridor_id: 'cor-04',
            corridor_code: 'COR-D04',
            corridor_name: 'Chennai Central – Arakkonam Suburban Quad',
            status: 'NORMAL',
            asset_availability: 98.1,
            total_assets: 29,
            critical_defects: 0,
            pending_maintenance: 1,
            active_blocks: 0,
            train_density: 'HIGH',
          },
        ],
        corridors: [
          {
            corridor_id: 'cor-01',
            corridor_code: 'COR-A01',
            corridor_name: 'New Delhi – Agra Cantt High-Density Trunk',
            status: 'NORMAL',
            asset_availability: 96.8,
            total_assets: 48,
            critical_defects: 1,
            pending_maintenance: 3,
            active_blocks: 1,
            train_density: 'HIGH',
          },
        ],
      },
    }
  }

  // 2. Risk & AI Endpoints
  if (cleanUrl.startsWith('ai/risk/summary') || cleanUrl.startsWith('risk/summary')) {
    return {
      success: true,
      data: {
        total_assessed: 120,
        critical_risk_count: 2,
        high_risk_count: 5,
        medium_risk_count: 14,
        low_risk_count: 99,
        avg_health_score: 88.4,
        high_risk_assets: [
          {
            asset_id: 'TRK-4582',
            asset_code: 'TRK-4582',
            asset_name: 'Main Line Track Section A-B',
            asset_type: 'TRACK',
            department: 'ENG',
            health_score: 58.2,
            failure_probability: 0.82,
            risk_level: 'CRITICAL',
            recommended_action: 'Schedule emergency tamping block within 48 hours',
          },
          {
            asset_id: 'OHE-245',
            asset_code: 'OHE-245',
            asset_name: 'OHE Feeder Line #245',
            asset_type: 'TRACTION',
            department: 'TRC',
            health_score: 62.4,
            failure_probability: 0.76,
            risk_level: 'CRITICAL',
            recommended_action: 'OHE contact wire inspection and insulator wash',
          },
        ],
      },
    }
  }

  if (cleanUrl.startsWith('ai/risk/high-risk') || cleanUrl.startsWith('ai/risk/high') || cleanUrl.startsWith('risk/high')) {
    const highRiskList = [
      {
        asset_id: 'TRK-4582',
        asset_code: 'TRK-4582',
        asset_name: 'Main Line Track Section A-B',
        asset_type: 'TRACK',
        department: 'ENG',
        health_score: 58.2,
        failure_probability: 0.82,
        risk_level: 'CRITICAL',
        corridor_code: 'COR-A01',
        predicted_failure_date: '2026-09-04',
        recommended_action: 'Schedule emergency tamping block within 48 hours',
      },
      {
        asset_id: 'OHE-245',
        asset_code: 'OHE-245',
        asset_name: 'OHE Feeder Line #245',
        asset_type: 'TRACTION',
        department: 'TRC',
        health_score: 62.4,
        failure_probability: 0.76,
        risk_level: 'CRITICAL',
        corridor_code: 'COR-A01',
        predicted_failure_date: '2026-09-05',
        recommended_action: 'OHE contact wire inspection and insulator wash',
      },
      {
        asset_id: 'SIG-1201',
        asset_code: 'SIG-1201',
        asset_name: 'Signal Relay Room North',
        asset_type: 'SIGNAL',
        department: 'SIG',
        health_score: 71.3,
        failure_probability: 0.54,
        risk_level: 'HIGH',
        corridor_code: 'COR-A01',
        predicted_failure_date: '2026-09-12',
        recommended_action: 'Perform relay testing and battery bank check',
      },
    ]
    return {
      success: true,
      data: {
        items: highRiskList,
        pagination: { total: highRiskList.length, page: 1, page_size: 10, total_pages: 1 },
      },
    }
  }

  // 3. Corridors
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

  // 4. Block Requests & Plans
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

  // 5. Trains & Timetables
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

  // 6. Assets
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

  // 7. Maintenance Tasks
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

  // 8. Defects
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
      {
        id: 'def-03',
        defect_code: 'DEF-SIG-003',
        asset_id: 'SIG-1201',
        asset_name: 'Signal Relay Room North',
        severity: 'MEDIUM',
        status: 'OPEN',
        defect_type: 'TRACK_CIRCUIT_FLICKER',
        reported_at: '2026-08-31T14:10:00Z',
        location: 'Station Alpha',
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

  // 9. AI & Optimization & Planner
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

  // 10. Simulation & Digital Twin
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

  // 11. Generic fallback response
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
