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
        id: 'risk-trk-4582',
        asset_id: 'TRK-4582',
        asset_code: 'TRK-4582',
        asset_name: 'Main Line Track Section A-B',
        asset_type: 'TRACK',
        department: 'ENG',
        health_score: 58.2,
        criticality_score: 85.0,
        risk_score: 82.4,
        failure_probability: 0.82,
        risk_level: 'CRITICAL',
        corridor_code: 'COR-A01',
        corridor_id: 'COR-A01',
        predicted_failure_date: '2026-09-04',
        recommended_action: 'Schedule emergency tamping block within 48 hours',
      },
      {
        id: 'risk-ohe-245',
        asset_id: 'OHE-245',
        asset_code: 'OHE-245',
        asset_name: 'OHE Feeder Line #245',
        asset_type: 'TRACTION',
        department: 'TRC',
        health_score: 62.4,
        criticality_score: 92.0,
        risk_score: 78.6,
        failure_probability: 0.76,
        risk_level: 'CRITICAL',
        corridor_code: 'COR-A01',
        corridor_id: 'COR-A01',
        predicted_failure_date: '2026-09-05',
        recommended_action: 'OHE contact wire inspection and insulator wash',
      },
      {
        id: 'risk-sig-1201',
        asset_id: 'SIG-1201',
        asset_code: 'SIG-1201',
        asset_name: 'Signal Relay Room North',
        asset_type: 'SIGNAL',
        department: 'SIG',
        health_score: 71.3,
        criticality_score: 78.0,
        risk_score: 64.0,
        failure_probability: 0.54,
        risk_level: 'HIGH',
        corridor_code: 'COR-A01',
        corridor_id: 'COR-A01',
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

  // 9. Planner & AI Optimization Engines
  if (cleanUrl.startsWith('planner/daily') || cleanUrl.startsWith('planner/get-daily')) {
    const dailyPlanResult = {
      planning_id: 'AI-PLAN-DAILY-001',
      planning_date: '2026-09-01',
      corridor_id: 'cor-01',
      corridor_name: 'New Delhi – Agra Cantt (COR-A01)',
      status: 'AI_GENERATED',
      summary: {
        planning_run_id: 'AI-PLAN-DAILY-001',
        planning_date: '2026-09-01',
        planning_horizon: 'DAILY',
        corridors_analyzed: 1,
        tasks_analyzed: 14,
        tasks_selected: 11,
        tasks_unplanned: 3,
        critical_tasks_total: 3,
        critical_tasks_covered: 3,
        overdue_tasks_covered: 4,
        blocks_generated: 1,
        shared_blocks_generated: 1,
        departments_coordinated: 3,
        expected_train_delay_minutes: 0.0,
        optimization_score: 98.4,
        planning_confidence: 98.4,
        time_saved_minutes: 150,
        downtime_reduction_pct: 55.6,
        validation_status: 'VALIDATED',
        solver_duration_seconds: 0.85,
      },
      recommended_blocks: [
        {
          block_id: 'AI-BLK-0001',
          corridor_id: 'cor-01',
          corridor_name: 'New Delhi – Agra Cantt (COR-A01)',
          date: '2026-09-01',
          start_time: '01:00',
          end_time: '03:00',
          duration_minutes: 120,
          departments: ['ENG', 'SIG', 'TRC'],
          is_shared_block: true,
          task_count: 5,
          critical_task_count: 2,
          expected_train_delay: 0.0,
          maximum_train_delay: 0.0,
          asset_availability_gain: 18.5,
          block_utilization: 92.4,
          optimization_score: 98.4,
          confidence: 98.4,
          risk_level: 'LOW',
          reason: 'Multi-discipline night possession gap without timetable friction.',
          constraints_checked: ['25kV Traction Isolated', 'Pass Headway Buffer Maintained', 'Multi-Discipline Synergy Active'],
          approval_status: 'PENDING',
          tasks: [
            { task_id: 'TSK-101', task_code: 'MT-ENG-001', department: 'ENG', asset_name: 'Main Line Track Section Km 45.2', priority: 'CRITICAL', duration_minutes: 120, is_overdue: true },
            { task_id: 'TSK-102', task_code: 'MT-SIG-002', department: 'SIG', asset_name: 'Point Machine #104 Yard North', priority: 'CRITICAL', duration_minutes: 90, is_overdue: true },
            { task_id: 'TSK-103', task_code: 'MT-TRC-003', department: 'TRC', asset_name: 'OHE Feeder Wire #245', priority: 'HIGH', duration_minutes: 90, is_overdue: false },
            { task_id: 'TSK-104', task_code: 'MT-ENG-004', department: 'ENG', asset_name: 'Ballast Tamping Section Km 47.0', priority: 'HIGH', duration_minutes: 60, is_overdue: false },
            { task_id: 'TSK-105', task_code: 'MT-SIG-005', department: 'SIG', asset_name: 'Track Circuit Relay #201', priority: 'MEDIUM', duration_minutes: 45, is_overdue: false }
          ],
          affected_trains: [],
          alternatives: [
            { slot: '01:00 – 03:00 (Night Window)', trainImpact: '0.0 min (Zero delay)', conflictCount: 0, feasibilityScore: 98.5, status: 'RECOMMENDED' },
            { slot: '03:30 – 05:30 (Early Morning)', trainImpact: '+18.0 min (Freight 56813)', conflictCount: 1, feasibilityScore: 72.0, status: 'FEASIBLE' },
            { slot: '18:00 – 20:00 (Evening Peak)', trainImpact: '+45.0 min (3 Express Trains)', conflictCount: 3, feasibilityScore: 34.0, status: 'HIGH_FRICTION' }
          ]
        }
      ],
      timeline: {
        hours: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
        corridors: [
          {
            corridor_id: 'cor-01',
            corridor_code: 'COR-A01',
            corridor_name: 'New Delhi – Agra Cantt',
            events: [
              { type: 'TRAIN', title: 'Express 12601', start_time: '23:00', end_time: '00:30', status: 'SCHEDULED' },
              { type: 'AI_BLOCK', title: 'BP-20260901-AI-BLK-0001 (120m)', start_time: '01:00', end_time: '03:00', status: 'AI_RECOMMENDED', plan_id: 'AI-BLK-0001' },
              { type: 'TRAIN', title: 'Freight 56813', start_time: '03:30', end_time: '05:00', status: 'SCHEDULED' },
              { type: 'TRAIN', title: 'Vande Bharat 22436', start_time: '06:00', end_time: '08:00', status: 'SCHEDULED' }
            ]
          },
          {
            corridor_id: 'cor-02',
            corridor_code: 'COR-B02',
            corridor_name: 'Mumbai Central – Ahmedabad',
            events: [
              { type: 'TRAIN', title: 'Rajdhani 12951', start_time: '16:00', end_time: '18:00', status: 'SCHEDULED' },
              { type: 'APPROVED_BLOCK', title: 'BP-20260901-B02 (180m)', start_time: '01:30', end_time: '04:30', status: 'APPROVED', plan_id: 'BLK-B02-01' }
            ]
          }
        ]
      },
      unplanned_tasks: [
        { task_id: 'TSK-108', task_code: 'MT-ENG-008', department: 'ENG', priority: 'LOW', reason: 'Deferred to weekly window' }
      ],
      plan_comparison: {
        manual_baseline: { total_downtime_minutes: 270, total_blocks: 3, train_delay_minutes: 26.0 },
        ai_optimized: { total_downtime_minutes: 120, total_blocks: 1, train_delay_minutes: 0.0 },
        savings: { time_saved_minutes: 150, downtime_reduction_pct: 55.6, train_delay_avoided_minutes: 26.0 }
      },
      explanation: {
        why_selected: ['Safety Critical Switch Turnout #104', 'Overdue Track Grinding Section Km 45.2', 'OHE Catenary Alignment'],
        why_this_time: 'Zero timetable friction between Express 12601 and Freight 56813 night gap (01:00-03:00).',
        why_not_others: ['Deferred non-critical low priority yard tasks to daytime maintenance siding'],
        overall_narrative: ['CP-SAT solver bundled 3 separate departmental possession requests into 1 unified 120-minute window.'],
        validation_checks: ['25kV Traction Isolated', 'Pass Headway Buffer Maintained', 'Multi-Discipline Synergy Active']
      }
    }
    return { success: true, data: dailyPlanResult, message: 'Daily maintenance block plan generated successfully' }
  }

  if (cleanUrl.startsWith('planner/weekly')) {
    const weeklyPlanResult = {
      weekly_plan_id: 'WK-PLAN-2026-0901',
      status: 'COMPLETED',
      start_date: '2026-09-01',
      end_date: '2026-09-07',
      summary: {
        weekly_plan_id: 'WK-PLAN-2026-0901',
        start_date: '2026-09-01',
        end_date: '2026-09-07',
        total_tasks_scheduled: 42,
        critical_tasks_covered: 8,
        overdue_reduction_pct: 75.0,
        total_blocks_planned: 7,
        shared_blocks_count: 5,
        average_block_utilization_pct: 88.6,
        total_expected_train_delay_minutes: 0.0,
        asset_availability_gain_pct: 14.2,
        optimization_score: 96.5,
      },
      days: [
        { day_index: 0, day_name: 'Mon', date: '2026-09-01', tasks_count: 6, critical_tasks_count: 2, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 92.0, status: 'OPTIMAL' },
        { day_index: 1, day_name: 'Tue', date: '2026-09-02', tasks_count: 5, critical_tasks_count: 1, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 89.0, status: 'OPTIMAL' },
        { day_index: 2, day_name: 'Wed', date: '2026-09-03', tasks_count: 7, critical_tasks_count: 2, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 94.0, status: 'OPTIMAL' },
        { day_index: 3, day_name: 'Thu', date: '2026-09-04', tasks_count: 6, critical_tasks_count: 1, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 86.0, status: 'OPTIMAL' },
        { day_index: 4, day_name: 'Fri', date: '2026-09-05', tasks_count: 5, critical_tasks_count: 1, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 85.0, status: 'OPTIMAL' },
        { day_index: 5, day_name: 'Sat', date: '2026-09-06', tasks_count: 8, critical_tasks_count: 1, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 90.0, status: 'OPTIMAL' },
        { day_index: 6, day_name: 'Sun', date: '2026-09-07', tasks_count: 5, critical_tasks_count: 0, blocks_count: 1, expected_train_delay: 0, block_utilization_pct: 84.0, status: 'OPTIMAL' },
      ],
      plan_comparison: {
        manual_baseline: { total_downtime_minutes: 1890, total_blocks: 21 },
        ai_optimized: { total_downtime_minutes: 840, total_blocks: 7 },
        savings: { time_saved_minutes: 1050, downtime_reduction_pct: 55.6 }
      }
    }
    return { success: true, data: weeklyPlanResult, message: 'Weekly maintenance block plan generated successfully' }
  }

  if (cleanUrl.startsWith('planner/monthly')) {
    const monthlyPlanResult = {
      monthly_plan_id: 'MO-PLAN-2026-09',
      year: 2026,
      month: 9,
      status: 'COMPLETED',
      summary: {
        total_tasks_scheduled: 168,
        total_blocks_planned: 28,
        shared_blocks_planned: 22,
        expected_overdue_reduction_pct: 88.0,
        average_utilization_pct: 89.4,
        expected_asset_availability_pct: 98.1,
        optimization_score: 97.2,
      },
      weeks: [
        { week_number: 1, start_date: '2026-09-01', end_date: '2026-09-07', tasks_quota: 42, critical_tasks_scheduled: 8, blocks_planned: 7, utilization_pct: 88.6, status: 'SCHEDULED' },
        { week_number: 2, start_date: '2026-09-08', end_date: '2026-09-14', tasks_quota: 40, critical_tasks_scheduled: 6, blocks_planned: 7, utilization_pct: 90.2, status: 'SCHEDULED' },
        { week_number: 3, start_date: '2026-09-15', end_date: '2026-09-21', tasks_quota: 44, critical_tasks_scheduled: 7, blocks_planned: 7, utilization_pct: 87.5, status: 'SCHEDULED' },
        { week_number: 4, start_date: '2026-09-22', end_date: '2026-09-30', tasks_quota: 42, critical_tasks_scheduled: 5, blocks_planned: 7, utilization_pct: 91.0, status: 'SCHEDULED' }
      ],
      department_workload: [
        { department: 'Civil Track (ENG)', tasks_count: 68, quota_pct: 40.5 },
        { department: 'Signaling & Telecom (SIG)', tasks_count: 56, quota_pct: 33.3 },
        { department: 'Electrical Traction (TRC)', tasks_count: 44, quota_pct: 26.2 }
      ]
    }
    return { success: true, data: monthlyPlanResult, message: 'Monthly capacity plan generated successfully' }
  }

  if (cleanUrl.includes('/modify')) {
    return {
      success: true,
      data: {
        is_valid: true,
        message: 'Possession window rescheduled successfully. Conflict matrix evaluated: 0 conflicts.',
        new_start_time: '01:00',
        new_end_time: '03:00'
      }
    }
  }

  if (cleanUrl.includes('/publish')) {
    return {
      success: true,
      data: {
        status: 'PUBLISHED',
        message: 'Block plan successfully approved and published to divisional train control.'
      }
    }
  }

  if (cleanUrl.includes('/reset')) {
    return {
      success: true,
      data: {
        status: 'RESET',
        message: 'SIH Demonstration scenario reset to original deterministic baseline.'
      }
    }
  }

  if (cleanUrl.startsWith('ai/planner') || cleanUrl.startsWith('planner/ai')) {
    const aiPlanningResultData = {
      planning_run_id: 'AI-RUN-2026-0901',
      status: 'COMPLETED',
      planning_date: '2026-09-01',
      horizon: 'DAILY',
      corridor_id: 'cor-01',
      corridor_name: 'New Delhi – Agra Cantt (COR-A01)',
      summary: {
        planning_run_id: 'AI-RUN-2026-0901',
        planning_date: '2026-09-01',
        planning_horizon: 'DAILY',
        corridors_analyzed: 1,
        tasks_analyzed: 14,
        tasks_selected: 11,
        tasks_unplanned: 3,
        critical_tasks_total: 3,
        critical_tasks_covered: 3,
        overdue_tasks_covered: 4,
        blocks_generated: 1,
        shared_blocks_generated: 1,
        departments_coordinated: 3,
        expected_train_delay_minutes: 0.0,
        optimization_score: 98.4,
        planning_confidence: 98.4,
        time_saved_minutes: 150,
        downtime_reduction_pct: 55.6,
        validation_status: 'VALIDATED',
        solver_duration_seconds: 0.85
      },
      recommended_blocks: [
        {
          block_id: 'AI-BLK-0001',
          corridor_id: 'cor-01',
          corridor_name: 'New Delhi – Agra Cantt (COR-A01)',
          date: '2026-09-01',
          start_time: '01:00',
          end_time: '03:00',
          duration_minutes: 120,
          departments: ['ENG', 'SIG', 'TRC'],
          is_shared_block: true,
          task_count: 5,
          critical_task_count: 2,
          expected_train_delay: 0.0,
          maximum_train_delay: 0.0,
          asset_availability_gain: 18.5,
          block_utilization: 92.4,
          optimization_score: 98.4,
          confidence: 98.4,
          risk_level: 'LOW',
          reason: 'Multi-discipline night possession gap without timetable friction.',
          constraints_checked: ['25kV Traction Isolated', 'Pass Headway Buffer Maintained', 'Multi-Discipline Synergy Active'],
          approval_status: 'PENDING',
          tasks: [
            { task_id: 'TSK-101', task_code: 'MT-ENG-001', department: 'ENG', asset_name: 'Main Line Track Section Km 45.2', priority: 'CRITICAL', duration_minutes: 120, is_overdue: true },
            { task_id: 'TSK-102', task_code: 'MT-SIG-002', department: 'SIG', asset_name: 'Point Machine #104 Yard North', priority: 'CRITICAL', duration_minutes: 90, is_overdue: true },
            { task_id: 'TSK-103', task_code: 'MT-TRC-003', department: 'TRC', asset_name: 'OHE Feeder Wire #245', priority: 'HIGH', duration_minutes: 90, is_overdue: false }
          ],
          affected_trains: [],
          alternatives: []
        }
      ],
      unplanned_tasks: [
        { task_id: 'TSK-108', task_code: 'MT-ENG-008', department: 'ENG', priority: 'LOW', reason: 'Lower priority; deferred to weekly possession window' }
      ],
      plan_comparison: {
        baseline_downtime_minutes: 270,
        optimized_downtime_minutes: 120,
        downtime_saved_minutes: 150,
        baseline_train_delay_minutes: 26.0,
        optimized_train_delay_minutes: 0.0
      },
      explanation: {
        why_selected: ['Safety Critical Switch Overhaul', 'Overdue Track Grinding'],
        why_not_others: ['Deferred routine low-priority tasks to secondary window'],
        overall_narrative: ['CP-SAT solver achieved 55.6% downtime reduction with zero express train delays.'],
        validation_checks: ['Electrical Isolation Verified', 'Headway Clearance Maintained']
      }
    }
    return { success: true, data: aiPlanningResultData, message: 'AI maintenance block plan generated successfully' }
  }

  if (cleanUrl.startsWith('ai/train-impact') || cleanUrl.startsWith('train-impact') || cleanUrl.startsWith('trains/impact')) {
    const trainImpactData = {
      corridor_id: 'cor-01',
      corridor_name: 'New Delhi – Agra Cantt (COR-A01)',
      start_time: '2026-09-01T01:00:00Z',
      end_time: '2026-09-01T03:00:00Z',
      duration_minutes: 120,
      affected_trains_count: 0,
      total_delay_minutes: 0.0,
      max_delay_minutes: 0.0,
      train_impacts: [],
      risk_level: 'LOW',
      recommendations: ['Recommended window: Zero train delays predicted between 01:00 and 03:00.'],
      alternatives: [
        { start_time: '01:00', duration_minutes: 120, train_impact_minutes: 0.0, feasibility_score: 98.5, label: '01:00 – 03:00 (Zero Delay)' },
        { start_time: '03:30', duration_minutes: 120, train_impact_minutes: 18.0, feasibility_score: 72.0, label: '03:30 – 05:30 (+18m Freight)' }
      ]
    }
    return { success: true, data: trainImpactData, message: 'Train impact simulated successfully' }
  }

  // 10. General AI & Optimization
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
