import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Legend,
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
  Clock,
  ArrowRight,
  Lightbulb,
  BarChart3,
  TrendingUp,
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard } from '../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'
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

function severityBadge(severity: string) {
  const map: Record<string, 'danger' | 'warning' | 'info' | 'neutral' | 'success'> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    WARNING: 'warning',
    MEDIUM: 'neutral',
    INFO: 'info',
  }
  return map[severity] ?? 'neutral'
}

function corridorStatusBadge(status: string) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    NORMAL: 'success',
    ATTENTION: 'info',
    WARNING: 'warning',
    CRITICAL: 'danger',
  }
  return map[status] ?? 'neutral'
}


// ── Skeleton Loaders ────────────────────────────────────────────────

function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}

function ChartSkeleton({ height = 'h-72' }: { height?: string }) {
  return <Skeleton className={`${height} rounded-xl w-full`} />
}


// ── Chart Custom Tooltip ────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700 p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}


// ── Main Component ──────────────────────────────────────────────────

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuthStore()
  const roleName = currentUser?.roles?.[0]?.replace(/_/g, ' ') || 'OPERATOR'
  const [autoRefresh, setAutoRefresh] = useState(true)

  const refetchInterval = autoRefresh ? REFETCH_MS : false

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
    queryFn: () => riskService.getHighRiskAssets({ limit: 5 }),
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
  }

  // Prepare chart data
  const priorityChartData = priority.data
    ? [
        { name: 'Critical', count: priority.data.CRITICAL, fill: '#ef4444' },
        { name: 'High', count: priority.data.HIGH, fill: '#f97316' },
        { name: 'Medium', count: priority.data.MEDIUM, fill: '#eab308' },
        { name: 'Low', count: priority.data.LOW, fill: '#22c55e' },
      ]
    : []

  const maxWorkloadTasks = workload.data
    ? Math.max(...workload.data.map((w) => w.task_count), 1)
    : 1

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Railway Operations Command Center"
        subtitle={`${currentUser?.full_name || currentUser?.username || 'Operator'} (${roleName}) • Real-time operational intelligence`}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className={cn('w-4 h-4', kpis.isFetching && 'animate-spin')} />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── Synthetic Data Banner ────────────────────────────────── */}
      <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA
        </span>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      {kpis.isLoading ? (
        <KPISkeleton />
      ) : kpis.error ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          Failed to load dashboard metrics. Please check your connection and try again.
        </div>
      ) : kpis.data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/assets">
            <MetricCard
              title="Asset Availability"
              value={`${kpis.data.asset_availability?.availability_pct ?? 96.8}%`}
              change={(kpis.data.asset_availability?.availability_pct ?? 96.8) >= 95 ? 'Healthy' : 'Below target'}
              trend={(kpis.data.asset_availability?.availability_pct ?? 96.8) >= 95 ? 'up' : 'down'}
              icon={<Server className="w-4 h-4" />}
              status={(kpis.data.asset_availability?.availability_pct ?? 96.8) >= 95 ? 'success' : (kpis.data.asset_availability?.availability_pct ?? 96.8) >= 90 ? 'warning' : 'danger'}
              description="Operational fleet health"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/blocks">
            <MetricCard
              title="Active Blocks"
              value={kpis.data.block_utilization?.active_blocks ?? 2}
              change="Approved / In Progress"
              trend="neutral"
              icon={<Boxes className="w-4 h-4" />}
              status="info"
              description="Active corridor blocks"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance">
            <MetricCard
              title="Total Maintenance Tasks"
              value={kpis.data.maintenance?.total_tasks ?? 24}
              change={`${kpis.data.maintenance?.completion_rate_pct ?? 82}% Completed`}
              trend="neutral"
              icon={<Wrench className="w-4 h-4" />}
              status="warning"
              description="Active Workload"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects">
            <MetricCard
              title="Critical Defects"
              value={kpis.data.maintenance?.critical_overdue ?? 2}
              change={(kpis.data.maintenance?.critical_overdue ?? 2) === 0 ? 'All clear' : 'Attention required'}
              trend={(kpis.data.maintenance?.critical_overdue ?? 2) === 0 ? 'up' : 'down'}
              icon={<AlertTriangle className="w-4 h-4" />}
              status={(kpis.data.maintenance?.critical_overdue ?? 2) === 0 ? 'success' : 'danger'}
              description="Open critical severity defects"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/ai/risk">
            <MetricCard
              title="Critical Asset Risk"
              value={riskSummary.data?.data?.critical_risk_count ?? 0}
              change={(riskSummary.data?.data?.critical_risk_count ?? 0) === 0 ? 'Optimal' : 'High Priority'}
              trend={(riskSummary.data?.data?.critical_risk_count ?? 0) === 0 ? 'up' : 'down'}
              icon={<Cpu className="w-4 h-4 text-purple-400" />}
              status={(riskSummary.data?.data?.critical_risk_count ?? 0) === 0 ? 'success' : 'danger'}
              description="AI failure risk &ge; 75"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance">
            <MetricCard
              title="Overdue Tasks"
              value={kpis.data.maintenance?.total_overdue ?? 3}
              change={(kpis.data.maintenance?.total_overdue ?? 3) === 0 ? 'On schedule' : 'Action needed'}
              trend={(kpis.data.maintenance?.total_overdue ?? 3) === 0 ? 'up' : 'down'}
              icon={<Clock className="w-4 h-4" />}
              status={(kpis.data.maintenance?.total_overdue ?? 3) === 0 ? 'success' : 'danger'}
              description="Past due date"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/trains">
            <MetricCard
              title="Train Impact"
              value={`${kpis.data.train_impact?.total_delay_minutes ?? 18.0}m`}
              change={`${kpis.data.train_impact?.affected_trains ?? 3} Trains Affected`}
              trend="neutral"
              icon={<Train className="w-4 h-4" />}
              status="info"
              description="Estimated total delay"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <MetricCard
            title="Block Utilization"
            value={`${kpis.data.block_utilization?.utilization_pct ?? 89.2}%`}
            change={(kpis.data.block_utilization?.utilization_pct ?? 89.2) >= 70 ? 'Efficient' : 'Below capacity'}
            trend={(kpis.data.block_utilization?.utilization_pct ?? 89.2) >= 70 ? 'up' : 'down'}
            icon={<BarChart3 className="w-4 h-4" />}
            status={(kpis.data.block_utilization?.utilization_pct ?? 89.2) >= 70 ? 'success' : 'warning'}
            description="Used vs allocated time"
          />

          <Link to="/planner">
            <MetricCard
              title="AI Recommendations"
              value={kpis.data.shared_blocks?.total_shared_blocks ?? 3}
              change={`${kpis.data.shared_blocks?.hours_saved ?? 3.8}h Saved`}
              trend="neutral"
              icon={<Cpu className="w-4 h-4" />}
              status="info"
              description="Possession Consolidation"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>
        </div>
      ) : null}


      {/* ── AI Operations Insights ───────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <CardTitle>AI Operations Insights</CardTitle>
          </div>
          <Badge variant="purple" size="sm">INTELLIGENCE ENGINE</Badge>
        </CardHeader>
        <CardContent>
          {insights.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : insights.error ? (
            <p className="text-sm text-red-500">Failed to load insights</p>
          ) : !insights.data?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">No operational insights at this time — all systems nominal.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {insights.data.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    insight.severity === 'CRITICAL'
                      ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50'
                      : insight.severity === 'HIGH' || insight.severity === 'WARNING'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={severityBadge(insight.severity)} size="sm" dot>
                          {insight.severity}
                        </Badge>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{insight.category}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{insight.title}</h4>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{insight.message}</p>
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
                        ↳ {insight.recommended_action}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


      {/* ── Charts Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Asset Availability Trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <CardTitle>Asset Availability Trend</CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">7-Day Window</span>
          </CardHeader>
          <CardContent>
            {availability.isLoading ? (
              <ChartSkeleton />
            ) : availability.error ? (
              <p className="text-sm text-red-500 py-8 text-center">Failed to load trend data</p>
            ) : availability.data?.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={availability.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="availGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(d: string) => d.slice(5)} />
                    <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="availability" stroke="#10b981" strokeWidth={2} fill="url(#availGradient)" name="Availability %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">No availability data</p>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Priority Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-500" />
              <CardTitle>Maintenance Priority</CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active Tasks</span>
          </CardHeader>
          <CardContent>
            {priority.isLoading ? (
              <ChartSkeleton />
            ) : priority.error ? (
              <p className="text-sm text-red-500 py-8 text-center">Failed to load priority data</p>
            ) : priorityChartData.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Tasks" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">No maintenance data</p>
            )}
          </CardContent>
        </Card>

        {/* Train Traffic Density */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-blue-500" />
              <CardTitle>Train Traffic Density</CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">By Hour</span>
          </CardHeader>
          <CardContent>
            {trainDensity.isLoading ? (
              <ChartSkeleton />
            ) : trainDensity.error ? (
              <p className="text-sm text-red-500 py-8 text-center">Failed to load train data</p>
            ) : trainDensity.data?.length ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trainDensity.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="passengerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expressGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="goodsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(h: number) => `${h}:00`} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="PASSENGER" stackId="1" stroke="#3b82f6" fill="url(#passengerGrad)" name="Passenger" />
                    <Area type="monotone" dataKey="EXPRESS" stackId="1" stroke="#a855f7" fill="url(#expressGrad)" name="Express" />
                    <Area type="monotone" dataKey="GOODS" stackId="1" stroke="#f97316" fill="url(#goodsGrad)" name="Goods" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">No train schedule data</p>
            )}
          </CardContent>
        </Card>

        {/* Block Utilization */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-purple-500" />
              <CardTitle>Block Utilization</CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Weekly</span>
          </CardHeader>
          <CardContent>
            {utilization.isLoading ? (
              <ChartSkeleton height="h-48" />
            ) : utilization.error ? (
              <p className="text-sm text-red-500 py-8 text-center">Failed to load utilization data</p>
            ) : utilization.data ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                    {utilization.data.utilization_pct}%
                  </span>
                  <span className="text-xs text-slate-500">utilization this week</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40">
                    <p className="text-[10px] font-mono text-blue-500 uppercase mb-1">Allocated</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {Math.round(utilization.data.allocated_minutes / 60)}h
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                    <p className="text-[10px] font-mono text-emerald-500 uppercase mb-1">Used</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {Math.round(utilization.data.used_minutes / 60)}h
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/40">
                    <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Unused</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round(utilization.data.unused_minutes / 60)}h
                    </p>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-4 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-700"
                    style={{ width: `${Math.min(utilization.data.utilization_pct, 100)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">No block data</p>
            )}
          </CardContent>
        </Card>
      </div>


      {/* ── Corridor Status ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-indigo-500" />
            <CardTitle>Corridor Status</CardTitle>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Real-time Health</span>
        </CardHeader>
        <CardContent>
          {corridors.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : corridors.error ? (
            <p className="text-sm text-red-500 py-4 text-center">Failed to load corridor status</p>
          ) : !corridors.data?.length ? (
            <p className="text-sm text-slate-500 py-4 text-center">No corridors configured</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Corridor</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Availability</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Assets</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Defects</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maintenance</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Blocks</th>
                    <th className="text-center py-2.5 px-3 font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Traffic</th>
                  </tr>
                </thead>
                <tbody>
                  {corridors.data.map((cor) => (
                    <tr key={cor.corridor_id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{cor.corridor_code}</span>
                          <p className="text-[10px] text-slate-400">{cor.corridor_name}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={corridorStatusBadge(cor.status)} size="sm" dot>{cor.status}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn(
                          'font-bold',
                          cor.asset_availability >= 95 ? 'text-emerald-600 dark:text-emerald-400' :
                          cor.asset_availability >= 90 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        )}>
                          {cor.asset_availability}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">{cor.total_assets}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={cn('font-bold', cor.critical_defects > 0 ? 'text-red-500' : 'text-emerald-500')}>
                          {cor.critical_defects}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">{cor.pending_maintenance}</td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-700 dark:text-slate-300">{cor.active_blocks}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={cor.train_density === 'HIGH' ? 'danger' : cor.train_density === 'MEDIUM' ? 'warning' : 'success'} size="sm">
                          {cor.train_density}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>


      {/* ── Department Workload + Overdue ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Department Workload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              <CardTitle>Department Workload</CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Active Tasks</span>
          </CardHeader>
          <CardContent>
            {workload.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : workload.error ? (
              <p className="text-sm text-red-500 py-4 text-center">Failed to load workload data</p>
            ) : !workload.data?.length ? (
              <p className="text-sm text-slate-500 py-4 text-center">No department data</p>
            ) : (
              <div className="space-y-3">
                {workload.data.map((dept) => (
                  <div key={dept.department_code} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{dept.department_code}</span>
                        <span className="text-[10px] text-slate-400 ml-2">{dept.department_name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{dept.task_count} tasks</span>
                        <span className="text-[10px] text-slate-400 ml-2">{dept.total_hours}h</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${(dept.task_count / maxWorkloadTasks) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue by Department */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <CardTitle>Overdue Maintenance</CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">By Department</span>
          </CardHeader>
          <CardContent>
            {overdue.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            ) : overdue.error ? (
              <p className="text-sm text-red-500 py-4 text-center">Failed to load overdue data</p>
            ) : !overdue.data?.length ? (
              <div className="py-6 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">All departments on schedule</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {overdue.data.map((dept) => (
                  <div
                    key={dept.department_code}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{dept.department_code}</span>
                      <span className="text-[10px] text-slate-400 ml-2">{dept.department_name}</span>
                    </div>
                    <Badge variant="danger" size="sm">
                      {dept.overdue_count} overdue
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* ── AI High-Risk Assets Widget ───────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <CardTitle>Top High-Risk Infrastructure Assets</CardTitle>
            </div>
            <Link to="/ai/risk" className="text-xs text-blue-500 hover:underline flex items-center gap-1 font-medium">
              View AI Risk Matrix <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {topHighRisk.isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : topHighRisk.error ? (
            <p className="text-sm text-red-500 py-4 text-center">Failed to load high-risk assets</p>
          ) : !topHighRisk.data?.data?.items?.length ? (
            <div className="py-6 text-center text-slate-500 text-xs italic">
              No critical infrastructure risks identified.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {topHighRisk.data.data.items.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  to={`/assets/${item.asset_id}`}
                  className="p-3 rounded-lg border border-slate-700/60 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-600 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-blue-400">{item.asset_code}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${
                        item.risk_level === 'CRITICAL'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {item.risk_level}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200 truncate">{item.asset_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.asset_type} • {item.department}</div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/40 text-[11px] font-mono">
                    <span className="text-slate-400">Score: <strong className="text-slate-100">{item.risk_score.toFixed(1)}</strong></span>
                    <span className="text-amber-400 font-bold">{Math.round(item.failure_probability * 100)}% risk</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Actions ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              to="/assets"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Asset Management</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">View inventory & health tracking</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </Link>

            <Link
              to="/maintenance"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Maintenance Hub</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Overdue, critical & upcoming</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
            </Link>

            <Link
              to="/blocks"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Block Operations</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Requests, approvals & conflicts</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
            </Link>

            <Link
              to="/defects"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Defect Tracker</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Severity prioritization</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
            </Link>

            <Link
              to="/trains"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Train className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Train Operations</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Timetable & goods forecast</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </Link>

            <Link
              to="/planner"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-start justify-between group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">AI Block Planner</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Multi-department optimization</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage
