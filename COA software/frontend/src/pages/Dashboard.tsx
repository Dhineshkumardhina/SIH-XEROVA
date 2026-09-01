import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Server,
  Wrench,
  AlertTriangle,
  Boxes,
  Train,
  Route as RouteIcon,
  Cpu,
  Shield,
  RefreshCw,
  Activity,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
  Play,
  ChevronRight
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
import { DemoControlPanel } from '../components/demo/DemoControlPanel'
import { useAuthStore } from '../store/authStore'
import { cn } from '../shared/utils'
import {
  getDashboardKPIs,
  getAssetAvailability,
  getMaintenancePriority,
  getBlockUtilization,
  getTrainDensity,
  getCorridorStatus,
  getAIInsights,
  getDepartmentWorkload,
  getOverdueMaintenance,
} from '../services/analytics'
import { riskService } from '../services/risk'
import { blockService } from '../services/blocks'
import { defectService } from '../services/defects'
import type {
  DashboardKPIs,
  AssetAvailabilityPoint,
  MaintenancePriorityData,
  TrainDensityPoint,
  CorridorStatusData,
  AIInsight,
  DepartmentWorkloadData,
  OverdueDeptData,
} from '../types/analytics'

// ── Constants & Helpers ─────────────────────────────────────────────

const REFETCH_MS = 30_000

function severityBadge(severity: string): 'danger' | 'warning' | 'info' | 'neutral' | 'success' {
  const map: Record<string, 'danger' | 'warning' | 'info' | 'neutral' | 'success'> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    WARNING: 'warning',
    MEDIUM: 'neutral',
    INFO: 'info',
  }
  return map[severity] ?? 'neutral'
}

function corridorStatusBadge(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    NORMAL: 'success',
    ATTENTION: 'info',
    WARNING: 'warning',
    CRITICAL: 'danger',
  }
  return map[status] ?? 'neutral'
}

function getDeptBadgeClass(dept: string): string {
  if (dept.includes('ENG') || dept.includes('TRACK')) return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800'
  if (dept.includes('SIG') || dept.includes('S&T')) return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
  if (dept.includes('TRC') || dept.includes('OHE')) return 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/40 dark:border-purple-800'
  return 'text-slate-700 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700'
}

// ── Skeleton Loaders ────────────────────────────────────────────────

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  )
}

function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return <Skeleton className={`${height} rounded-lg w-full`} />
}

// ── Chart Custom Tooltip ────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-slate-900 border border-slate-700 p-2.5 shadow-xl text-xs text-white">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="font-mono font-bold text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main Dashboard Component ────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuthStore()
  const roleName = currentUser?.roles?.[0]?.replace(/_/g, ' ') || 'CONTROL_OFFICER'
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString('en-IN', { hour12: false }))
  const currentDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })

  const refetchInterval = autoRefresh ? REFETCH_MS : false

  // Live operational clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ── Data Queries ────────────────────────────────────────────────
  const kpis = useQuery<DashboardKPIs>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboardKPIs,
    refetchInterval,
  })

  const availability = useQuery<AssetAvailabilityPoint[]>({
    queryKey: ['analytics', 'availability'],
    queryFn: () => getAssetAvailability(7),
    refetchInterval,
  })

  const priority = useQuery<MaintenancePriorityData>({
    queryKey: ['analytics', 'maintenance-priority'],
    queryFn: getMaintenancePriority,
    refetchInterval,
  })

  const utilization = useQuery({
    queryKey: ['analytics', 'block-utilization'],
    queryFn: () => getBlockUtilization('week'),
    refetchInterval,
  })

  const trainDensity = useQuery<TrainDensityPoint[]>({
    queryKey: ['analytics', 'train-density'],
    queryFn: getTrainDensity,
    refetchInterval,
  })

  const corridors = useQuery<CorridorStatusData[]>({
    queryKey: ['analytics', 'corridors'],
    queryFn: getCorridorStatus,
    refetchInterval,
  })

  const insights = useQuery<AIInsight[]>({
    queryKey: ['analytics', 'insights'],
    queryFn: getAIInsights,
    refetchInterval,
  })

  const workload = useQuery<DepartmentWorkloadData[]>({
    queryKey: ['analytics', 'workload'],
    queryFn: getDepartmentWorkload,
    refetchInterval,
  })

  const overdue = useQuery<OverdueDeptData[]>({
    queryKey: ['analytics', 'overdue'],
    queryFn: getOverdueMaintenance,
    refetchInterval,
  })

  const riskSummary = useQuery({
    queryKey: ['ai', 'risk', 'summary'],
    queryFn: () => riskService.getRiskSummary(),
    refetchInterval,
  })

  const topHighRisk = useQuery({
    queryKey: ['ai', 'risk', 'top-dashboard'],
    queryFn: () => riskService.getHighRiskAssets({ limit: 6 }),
    refetchInterval,
  })

  const upcomingBlocks = useQuery({
    queryKey: ['blocks', 'upcoming-dashboard'],
    queryFn: () => blockService.getBlockPlans({ page: 1, page_size: 5 }),
    refetchInterval,
  })

  const criticalDefects = useQuery({
    queryKey: ['defects', 'critical-dashboard'],
    queryFn: () => defectService.getCriticalDefects({ page: 1, page_size: 5 }),
    refetchInterval,
  })

  const handleRefresh = () => {
    kpis.refetch()
    availability.refetch()
    priority.refetch()
    utilization.refetch()
    trainDensity.refetch()
    corridors.refetch()
    insights.refetch()
    workload.refetch()
    overdue.refetch()
    riskSummary.refetch()
    topHighRisk.refetch()
    upcomingBlocks.refetch()
    criticalDefects.refetch()
  }

  // Prepare chart data
  const priorityChartData = priority.data
    ? [
        { name: 'Critical', count: priority.data.CRITICAL, fill: '#dc2626' },
        { name: 'High', count: priority.data.HIGH, fill: '#ea580c' },
        { name: 'Medium', count: priority.data.MEDIUM, fill: '#d97706' },
        { name: 'Low', count: priority.data.LOW, fill: '#16a34a' },
      ]
    : []

  const maxWorkloadTasks = workload.data
    ? Math.max(...workload.data.map((w) => w.task_count), 1)
    : 1

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. EXECUTIVE COMMAND HEADER ───────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                RAILOPT AI
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                AI-Powered Railway Block Planning & Operational Governance
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Date: <strong className="text-slate-700 dark:text-slate-200">{currentDate}</strong></span>
              <span>Clock: <strong className="font-mono text-slate-700 dark:text-slate-200">{currentTime} IST</strong></span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                SYSTEM OPERATIONAL
              </span>
              <span>Operator: <strong className="text-slate-700 dark:text-slate-200">{currentUser?.full_name || currentUser?.username || 'Control Officer'}</strong> ({roleName})</span>
            </div>
          </div>

          {/* Quick Command Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/conflicts')}
              leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              className="text-xs h-8 border-slate-300 dark:border-slate-700"
            >
              VIEW CONFLICTS
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/simulation')}
              leftIcon={<Play className="w-3.5 h-3.5 text-purple-500" />}
              className="text-xs h-8 border-slate-300 dark:border-slate-700"
            >
              RUN SIMULATION
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai/planner')}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-blue-500" />}
              className="text-xs h-8 border-slate-300 dark:border-slate-700"
            >
              OPEN DAILY PLANNER
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/ai/planner')}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              className="text-xs h-8 bg-blue-700 hover:bg-blue-600 text-white font-bold"
            >
              GENERATE AI PLAN
            </Button>
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all h-8',
                autoRefresh
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              )}
              title="Toggle automatic data polling (30s)"
            >
              <Activity className="w-3 h-3" />
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              leftIcon={<RefreshCw className={cn('w-3.5 h-3.5', kpis.isFetching && 'animate-spin')} />}
              className="h-8 px-2.5"
              title="Refresh all metrics"
            />
          </div>
        </div>
      </div>

      {/* ── SIH Guided Demo Control Panel ─────────────────────────── */}
      <DemoControlPanel compact={false} />

      {/* ── 2. TOP KPI SUMMARY STRIP (8 Key Metrics) ─────────────── */}
      {kpis.isLoading ? (
        <KPISkeleton />
      ) : (
        <div className="space-y-2.5">
          {kpis.error && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
              <span>Operational metrics in cached preview mode. Live sync unavailable.</span>
              <Button size="sm" variant="outline" onClick={() => handleRefresh()} className="h-6 text-[10px] px-2">
                <RefreshCw className="w-3 h-3 mr-1" /> Retry Live Sync
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* 1. Asset Availability */}
          <Link to="/assets" className="block">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Asset Availability</span>
              <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {kpis.data?.asset_availability?.availability_pct ?? 96.8}%
              </p>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">Target: 95.0% (Nominal)</span>
            </div>
          </Link>

          {/* 2. Critical Assets */}
          <Link to="/ai/risk" className="block">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Critical Assets</span>
              <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                {riskSummary.data?.data?.critical_risk_count ?? 2}
              </p>
              <span className="text-[10px] text-rose-500/80 block truncate mt-0.5">Failure Risk ≥ 75</span>
            </div>
          </Link>

          {/* 3. Overdue Tasks */}
          <Link to="/maintenance" className="block">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Overdue Tasks</span>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {kpis.data?.maintenance?.total_overdue ?? 3}
              </p>
              <span className="text-[10px] text-amber-600/80 block truncate mt-0.5">Requires Possession</span>
            </div>
          </Link>

          {/* 4. Today's Blocks */}
          <Link to="/blocks" className="block">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Today's Blocks</span>
              <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {kpis.data?.block_utilization?.active_blocks ?? 3}
              </p>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">Approved / Active</span>
            </div>
          </Link>

          {/* 5. Block Utilization */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Block Utilization</span>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {kpis.data?.block_utilization?.utilization_pct ?? 89.2}%
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">+14.2% efficiency</span>
          </div>

          {/* 6. Train Impact */}
          <Link to="/trains" className="block">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Train Impact</span>
              <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                {kpis.data?.train_impact?.total_delay_minutes ?? 18.0}m
              </p>
              <span className="text-[10px] text-slate-400 block truncate mt-0.5">{kpis.data?.train_impact?.affected_trains ?? 3} trains affected</span>
            </div>
          </Link>

          {/* 7. AI Recommendations */}
          <Link to="/ai/planner" className="block">
            <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/50 dark:bg-purple-950/20 hover:border-purple-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block truncate">AI Recommendations</span>
              <p className="text-xl font-bold font-mono text-purple-700 dark:text-purple-300 mt-1">
                {kpis.data?.shared_blocks?.total_shared_blocks ?? 3}
              </p>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 block truncate mt-0.5">+{kpis.data?.shared_blocks?.hours_saved ?? 3.8}h Downtime Saved</span>
            </div>
          </Link>

          {/* 8. Active Conflicts */}
          <Link to="/conflicts" className="block">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-400 transition-all shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">Active Conflicts</span>
              <p className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {kpis.data?.maintenance?.critical_overdue ?? 1}
              </p>
              <span className="text-[10px] text-amber-600/80 block truncate mt-0.5">Timetable Overlap</span>
            </div>
          </Link>
        </div>
        </div>
      )}

      {/* ── 3. MAIN COMMAND CENTER GRID ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── COLUMN 1: NETWORK HEALTH (Asset availability & Workload) */}
        <div className="space-y-6">
          {/* Asset Availability Trend */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    A. Network Infrastructure Health
                  </CardTitle>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">7-Day Curve</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {availability.isLoading ? (
                <ChartSkeleton height="h-48" />
              ) : availability.data?.length ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={availability.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#cbd5e1" opacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(d: string) => d.slice(5)} />
                      <YAxis domain={[85, 100]} tick={{ fontSize: 9, fill: '#64748b' }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="availability" stroke="#059669" strokeWidth={2} fill="#d1fae5" fillOpacity={0.6} name="Fleet Availability %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No trend telemetry available</p>
              )}
            </CardContent>
          </Card>

          {/* Department Workload & Overdue Allocation */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Department Workload Allocation
                  </CardTitle>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Active Work Orders</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {workload.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : !workload.data?.length ? (
                <p className="text-xs text-slate-400 py-4 text-center">All department queues clear.</p>
              ) : (
                <div className="space-y-3">
                  {workload.data.map((dept) => (
                    <div key={dept.department_code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.2 rounded font-mono font-bold text-[10px] border ${getDeptBadgeClass(dept.department_code)}`}>
                            {dept.department_code}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{dept.department_name}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-400">
                          {dept.task_count} tasks ({dept.total_hours}h)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${(dept.task_count / maxWorkloadTasks) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── COLUMN 2: BLOCK OPERATIONS (Upcoming schedule & Corridor status) */}
        <div className="space-y-6">
          {/* Upcoming Block Possession Schedule */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    B. Today's Block Schedule
                  </CardTitle>
                </div>
                <Link to="/blocks" className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5">
                  All Blocks <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {upcomingBlocks.isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded" />
                  ))}
                </div>
              ) : !upcomingBlocks.data?.data?.items?.length ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No active possession blocks currently scheduled.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {upcomingBlocks.data.data.items.slice(0, 4).map((blk: any) => (
                    <div
                      key={blk.id}
                      onClick={() => navigate('/ai/planner')}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{blk.plan_code}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(blk.planned_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(blk.planned_end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Badge
                          variant={blk.status === 'PUBLISHED' || blk.status === 'APPROVED' ? 'success' : blk.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                          size="sm"
                        >
                          {blk.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                        <span>Duration: <strong>{blk.duration_minutes}m</strong> | Tasks: <strong>{blk.tasks_included || blk.tasks?.length || 3}</strong></span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">0.0m delay</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Corridor Real-Time Status Table */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <RouteIcon className="w-4 h-4 text-indigo-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Corridor Availability & Traffic
                  </CardTitle>
                </div>
                <Link to="/corridors" className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-0.5">
                  Corridors <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {corridors.isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 rounded" />
                  ))}
                </div>
              ) : !corridors.data?.length ? (
                <p className="p-4 text-xs text-slate-400 text-center">No corridors configured.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 uppercase">
                      <tr>
                        <th className="py-2 px-3">Corridor</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center">Uptime</th>
                        <th className="py-2 px-3 text-center">Defects</th>
                        <th className="py-2 px-3 text-center">Traffic</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {corridors.data.slice(0, 4).map((cor) => (
                        <tr key={cor.corridor_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {cor.corridor_code}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <Badge variant={corridorStatusBadge(cor.status)} size="sm">
                              {cor.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {cor.asset_availability}%
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={cn('font-bold font-mono', cor.critical_defects > 0 ? 'text-red-600' : 'text-emerald-600')}>
                              {cor.critical_defects}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className="text-[10px] font-mono font-bold text-slate-500">{cor.train_density}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── COLUMN 3: TRAIN OPERATIONS (Traffic Density & Timetables) */}
        <div className="space-y-6">
          {/* Train Traffic Density Hourly Distribution */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Train className="w-4 h-4 text-blue-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    D. Train Operations & Headway Density
                  </CardTitle>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">24-Hour Timeline</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {trainDensity.isLoading ? (
                <ChartSkeleton height="h-48" />
              ) : trainDensity.data?.length ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trainDensity.data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#cbd5e1" opacity={0.5} />
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#64748b' }} tickFormatter={(h: number) => `${h}:00`} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="EXPRESS" stackId="1" stroke="#7c3aed" fill="#ede9fe" fillOpacity={0.7} name="Express Trains" />
                      <Area type="monotone" dataKey="PASSENGER" stackId="1" stroke="#2563eb" fill="#dbeafe" fillOpacity={0.7} name="Passenger Trains" />
                      <Area type="monotone" dataKey="GOODS" stroke="#ea580c" fill="#ffedd5" fillOpacity={0.7} name="Freight Rakes" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No timetable schedule loaded.</p>
              )}
            </CardContent>
          </Card>

          {/* Maintenance Priority Distribution */}
          <Card>
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Maintenance Task Urgency
                  </CardTitle>
                </div>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Queue Breakdown</span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {priority.isLoading ? (
                <ChartSkeleton height="h-40" />
              ) : priorityChartData.length ? (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={priorityChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#cbd5e1" opacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Tasks" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">No pending maintenance tasks.</p>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ── 4. SECTION C: RAILOPT AI INTELLIGENCE & INSIGHTS ───────── */}
      <Card className="border-purple-200 dark:border-purple-900/50 bg-gradient-to-br from-white via-purple-50/20 to-slate-50 dark:from-slate-900 dark:via-purple-950/10 dark:to-slate-900 shadow-sm">
        <CardHeader className="py-3 px-5 border-b border-purple-100 dark:border-purple-900/30">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                C. RAILOPT AI Operations Intelligence & Recommendations
              </CardTitle>
            </div>
            <Badge variant="purple" size="sm">ACTIVE AI AGENTS</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {insights.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : !insights.data?.length ? (
            <p className="text-xs text-slate-500 py-4 text-center">All operational parameters within standard limits.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {insights.data.map((insight) => (
                <div
                  key={insight.id}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={severityBadge(insight.severity)} size="sm">
                        {insight.severity}
                      </Badge>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">{insight.category}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{insight.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{insight.message}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                      ↳ {insight.recommended_action}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/ai/planner')}
                      className="text-[10px] h-6 px-2 border-slate-300 dark:border-slate-700"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 5. CRITICAL ASSETS PRIORITIZATION TABLE ───────────────── */}
      <Card>
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Critical Infrastructure Assets (Sorted by Failure Risk Score)
              </CardTitle>
            </div>
            <Link to="/ai/risk" className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1">
              Full AI Risk Matrix <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {topHighRisk.isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
              ))}
            </div>
          ) : !topHighRisk.data?.data?.items?.length ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No critical infrastructure assets currently flagged.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">Asset Code & Name</th>
                    <th className="py-2.5 px-3 font-bold">Department</th>
                    <th className="py-2.5 px-3 font-bold">Corridor</th>
                    <th className="py-2.5 px-3 font-bold text-center">Health Index</th>
                    <th className="py-2.5 px-3 font-bold text-center">Criticality</th>
                    <th className="py-2.5 px-3 font-bold text-center">AI Risk Score</th>
                    <th className="py-2.5 px-4 text-right font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topHighRisk.data.data.items.slice(0, 6).map((item, idx) => {
                    const failProb = Number(item.failure_probability) || 0.15
                    const score = Number(item.risk_score ?? (failProb * 100)) || 75.0
                    return (
                      <tr key={item.id || item.asset_id || `risk-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4">
                          <Link to={`/assets/${item.asset_id}`} className="font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline">
                            {item.asset_code}
                          </Link>
                          <span className="text-slate-700 dark:text-slate-300 font-medium ml-2">{item.asset_name}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getDeptBadgeClass(item.department)}`}>
                            {item.department}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-600 dark:text-slate-400">
                          {item.corridor_id || 'COR-A01'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {Math.round((1 - failProb) * 100)}%
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={item.risk_level === 'CRITICAL' ? 'danger' : item.risk_level === 'HIGH' ? 'warning' : 'info'} size="sm">
                            {item.risk_level}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          <span className={score >= 80 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                            {score.toFixed(1)} / 100
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/ai/planner')}
                            className="text-[11px] h-6 px-2.5 border-slate-300 dark:border-slate-700"
                          >
                            Plan Block
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 6. QUICK NAVIGATION TILES ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Link
          to="/assets"
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all text-center space-y-1 shadow-sm"
        >
          <Server className="w-4 h-4 mx-auto text-blue-600" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Assets</p>
          <span className="text-[10px] text-slate-400 block">Inventory & Telemetry</span>
        </Link>
        <Link
          to="/maintenance"
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 transition-all text-center space-y-1 shadow-sm"
        >
          <Wrench className="w-4 h-4 mx-auto text-amber-600" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Maintenance</p>
          <span className="text-[10px] text-slate-400 block">Overdue & Schedules</span>
        </Link>
        <Link
          to="/blocks"
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-400 transition-all text-center space-y-1 shadow-sm"
        >
          <Boxes className="w-4 h-4 mx-auto text-purple-600" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Blocks</p>
          <span className="text-[10px] text-slate-400 block">Possession Orders</span>
        </Link>
        <Link
          to="/defects"
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-red-400 transition-all text-center space-y-1 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 mx-auto text-red-600" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Defects</p>
          <span className="text-[10px] text-slate-400 block">Track Flaws & Relays</span>
        </Link>
        <Link
          to="/trains"
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 transition-all text-center space-y-1 shadow-sm"
        >
          <Train className="w-4 h-4 mx-auto text-blue-600" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Timetable</p>
          <span className="text-[10px] text-slate-400 block">Passenger & Freight</span>
        </Link>
        <Link
          to="/ai/planner"
          className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 transition-all text-center space-y-1 shadow-sm"
        >
          <Cpu className="w-4 h-4 mx-auto text-emerald-600" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Planner</p>
          <span className="text-[10px] text-slate-400 block">Multi-Horizon Solver</span>
        </Link>
      </div>
    </div>
  )
}

export default DashboardPage
