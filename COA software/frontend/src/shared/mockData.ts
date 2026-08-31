import type { DashboardStats } from '../types/dashboard'
import type { BlockPlan } from '../types/block'
import type { MaintenanceTask } from '../types/maintenance'
import type { Asset } from '../types/asset'

// ── Mock Dashboard Stats ────────────────────────────────────────────

export const mockStats: DashboardStats = {
  asset_availability: 96.8,
  active_blocks: 3,
  critical_defects: 4,
  overdue_tasks: 7,
}

// ── Mock Assets ─────────────────────────────────────────────────────

export const mockAssets: Asset[] = [
  { id: 'TRK-4582', department: 'TMS', name: 'Main Line Track Section A-B', health_score: 72.4, criticality: 'HIGH', last_maintained: '2026-07-15T09:30:00Z', location: 'Km 45.2 – Km 68.9' },
  { id: 'OHE-245', department: 'TDMS', name: 'OHE Feeder Line #245', health_score: 58.1, criticality: 'CRITICAL', last_maintained: '2026-06-02T14:00:00Z', location: 'Km 52.0 – Km 53.5' },
  { id: 'SIG-1201', department: 'SMMS', name: 'Signal Relay Room North', health_score: 91.3, criticality: 'HIGH', last_maintained: '2026-08-10T06:00:00Z', location: 'Station Alpha' },
  { id: 'BR-007', department: 'COA', name: 'Bridge #7 – River Crossing', health_score: 85.0, criticality: 'MEDIUM', last_maintained: '2026-05-20T12:00:00Z', location: 'Km 61.0' },
  { id: 'PT-330', department: 'TMS', name: 'Points & Crossings – Yard South', health_score: 44.2, criticality: 'CRITICAL', last_maintained: '2026-04-18T08:00:00Z', location: 'Station Bravo Yard' },
  { id: 'TRK-1100', department: 'TMS', name: 'Loop Line Track Section C-D', health_score: 93.7, criticality: 'LOW', last_maintained: '2026-08-20T10:00:00Z', location: 'Km 80.0 – Km 95.0' },
  { id: 'OHE-312', department: 'TDMS', name: 'OHE Mast #312', health_score: 67.8, criticality: 'MEDIUM', last_maintained: '2026-07-01T11:30:00Z', location: 'Km 55.8' },
  { id: 'SIG-1405', department: 'SMMS', name: 'Automatic Signal S-14', health_score: 89.5, criticality: 'HIGH', last_maintained: '2026-08-05T07:45:00Z', location: 'Km 70.2' },
]

// ── Mock Maintenance Tasks ──────────────────────────────────────────

export const mockTasks: MaintenanceTask[] = [
  { id: 'TSK-101', asset_id: 'TRK-4582', department: 'TMS', description: 'Main Line Track Grinding – Section A-B', priority: 'CRITICAL', duration_minutes: 120, is_overdue: true, created_at: '2026-08-12T09:00:00Z' },
  { id: 'TSK-102', asset_id: 'OHE-245', department: 'TDMS', description: 'OHE Feeder Wire Replacement', priority: 'HIGH', duration_minutes: 90, is_overdue: true, created_at: '2026-08-26T14:00:00Z' },
  { id: 'TSK-103', asset_id: 'PT-330', department: 'TMS', description: 'Points & Crossings Renewal', priority: 'CRITICAL', duration_minutes: 180, is_overdue: true, created_at: '2026-08-01T06:00:00Z' },
  { id: 'TSK-104', asset_id: 'SIG-1201', department: 'SMMS', description: 'Relay Testing & Calibration', priority: 'MEDIUM', duration_minutes: 60, is_overdue: false, created_at: '2026-08-28T08:30:00Z' },
  { id: 'TSK-105', asset_id: 'BR-007', department: 'COA', description: 'Bridge Girder Inspection', priority: 'HIGH', duration_minutes: 150, is_overdue: false, created_at: '2026-08-25T10:00:00Z' },
  { id: 'TSK-106', asset_id: 'OHE-312', department: 'TDMS', description: 'Mast Foundation Repair', priority: 'MEDIUM', duration_minutes: 100, is_overdue: false, created_at: '2026-08-29T12:00:00Z' },
  { id: 'TSK-107', asset_id: 'SIG-1405', department: 'SMMS', description: 'Signal Lamp & Lens Cleaning', priority: 'LOW', duration_minutes: 45, is_overdue: false, created_at: '2026-08-30T06:00:00Z' },
]

// ── Mock Block Plans ────────────────────────────────────────────────

export const mockBlockPlans: BlockPlan[] = [
  { id: 'BP-001', corridor: 'Section A-B', start_time: '2026-08-31T01:00:00Z', end_time: '2026-08-31T05:00:00Z', status: 'APPROVED', tasks_included: ['TSK-101', 'TSK-102'], train_impact: 2, downtime_saved_minutes: 135 },
  { id: 'BP-002', corridor: 'Station Bravo Yard', start_time: '2026-09-01T02:00:00Z', end_time: '2026-09-01T06:30:00Z', status: 'PENDING', tasks_included: ['TSK-103'], train_impact: 1, downtime_saved_minutes: 90 },
  { id: 'BP-AI-001', corridor: 'Section A-B', start_time: '2026-09-02T00:30:00Z', end_time: '2026-09-02T04:30:00Z', status: 'RECOMMENDED', tasks_included: ['TSK-101', 'TSK-102', 'TSK-103'], train_impact: 0, downtime_saved_minutes: 210 },
  { id: 'BP-003', corridor: 'Km 52 – Km 56', start_time: '2026-09-03T01:30:00Z', end_time: '2026-09-03T04:00:00Z', status: 'EXECUTED', tasks_included: ['TSK-106'], train_impact: 1, downtime_saved_minutes: 60 },
]

// ── Mock Analytics Data ─────────────────────────────────────────────

export const mockAvailabilityTrend = [
  { name: 'Mon', availability: 95.2, target: 97 },
  { name: 'Tue', availability: 96.1, target: 97 },
  { name: 'Wed', availability: 94.8, target: 97 },
  { name: 'Thu', availability: 97.3, target: 97 },
  { name: 'Fri', availability: 96.8, target: 97 },
  { name: 'Sat', availability: 98.1, target: 97 },
  { name: 'Sun', availability: 97.5, target: 97 },
]

export const mockDeptBreakdown = [
  { name: 'TMS', tasks: 12, completed: 8, overdue: 3 },
  { name: 'TDMS', tasks: 8, completed: 5, overdue: 2 },
  { name: 'SMMS', tasks: 6, completed: 5, overdue: 1 },
  { name: 'COA', tasks: 4, completed: 3, overdue: 1 },
]

export const mockBlockUtilization = [
  { name: 'Section A-B', planned: 240, actual: 210, efficiency: 87.5 },
  { name: 'Bravo Yard', planned: 270, actual: 245, efficiency: 90.7 },
  { name: 'Km 52-56', planned: 150, actual: 148, efficiency: 98.7 },
  { name: 'Section C-D', planned: 180, actual: 120, efficiency: 66.7 },
]
