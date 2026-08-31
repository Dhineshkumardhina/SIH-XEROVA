import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Activity,
  Boxes,
  Briefcase,
  TrendingUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { maintenanceService } from '../../services/maintenance'

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-xl" />
      ))}
    </div>
  )
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700 p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-400 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const MaintenanceDashboard: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['maintenance', 'analytics'],
    queryFn: maintenanceService.getAnalytics,
  })

  const { data: workload, isLoading: workloadLoading } = useQuery({
    queryKey: ['maintenance', 'department-workload'],
    queryFn: maintenanceService.getDepartmentWorkload,
  })

  const stats = analytics?.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Command Center"
        subtitle="Unified tracking for Engineering, Signal & Telecom, and Traction maintenance operations."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Maintenance' },
          { label: 'Dashboard' },
        ]}
      />

      {analyticsLoading ? (
        <DashboardSkeleton />
      ) : analyticsError || !stats ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 text-sm text-red-700">
          Failed to load maintenance dashboard metrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/maintenance/tasks">
            <MetricCard
              title="Total Tasks"
              value={stats.total_tasks}
              change="All registered tasks"
              trend="neutral"
              icon={<Briefcase className="w-4 h-4" />}
              status="info"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/tasks?date=today">
            <MetricCard
              title="Today's Maintenance"
              value={stats.todays_maintenance}
              change="Scheduled for today"
              trend="neutral"
              icon={<Activity className="w-4 h-4" />}
              status="warning"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/overdue">
            <MetricCard
              title="Overdue Tasks"
              value={stats.overdue}
              change={stats.overdue === 0 ? 'On schedule' : 'Action needed'}
              trend={stats.overdue === 0 ? 'up' : 'down'}
              icon={<Clock className="w-4 h-4" />}
              status={stats.overdue === 0 ? 'success' : 'danger'}
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/critical">
            <MetricCard
              title="Critical Tasks"
              value={stats.critical}
              change={stats.critical === 0 ? 'All clear' : 'Attention required'}
              trend={stats.critical === 0 ? 'up' : 'down'}
              icon={<AlertTriangle className="w-4 h-4" />}
              status={stats.critical === 0 ? 'success' : 'danger'}
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/critical">
            <MetricCard
              title="High Priority"
              value={stats.high_priority}
              change="High priority queue"
              trend="neutral"
              icon={<TrendingUp className="w-4 h-4" />}
              status="warning"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/tasks?status=IN_PROGRESS">
            <MetricCard
              title="In Progress"
              value={stats.in_progress}
              change="Currently executing"
              trend="neutral"
              icon={<Wrench className="w-4 h-4" />}
              status="info"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/tasks?status=COMPLETED">
            <MetricCard
              title="Completed (30d)"
              value={stats.completed_30d}
              change="Recently finished"
              trend="up"
              icon={<CheckCircle className="w-4 h-4" />}
              status="success"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/maintenance/tasks?block=required">
            <MetricCard
              title="Block Required"
              value={stats.block_required}
              change="Pending blocks"
              trend="neutral"
              icon={<Boxes className="w-4 h-4" />}
              status="info"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>
        </div>
      )}

      {/* Department Workload Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Department Workload</CardTitle>
          <span className="text-[10px] font-mono text-slate-400 uppercase">Tasks by Status</span>
        </CardHeader>
        <CardContent>
          {workloadLoading ? (
            <Skeleton className="h-72 w-full rounded-xl" />
          ) : !workload?.data?.length ? (
            <div className="h-72 flex items-center justify-center text-slate-500 text-sm">
              No department data available
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workload.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="department_code" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="pending" name="Pending" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="in_progress" name="In Progress" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MaintenanceDashboard
