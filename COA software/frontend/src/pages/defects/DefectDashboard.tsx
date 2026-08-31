import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Bug,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { defectService } from '../../services/defects'

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
    <div className="rounded-lg bg-slate-900 dark:bg-slate-800 border border-slate-700 p-3 shadow-xl text-xs z-50">
      <p className="text-slate-300 font-medium mb-1.5">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span className="text-slate-400 capitalize">{entry.name}:</span>
          <span className="text-white font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export const DefectDashboard: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['defects', 'analytics'],
    queryFn: defectService.getAnalytics,
  })

  const { data: workload, isLoading: workloadLoading } = useQuery({
    queryKey: ['defects', 'department-workload'],
    queryFn: defectService.getDepartmentBreakdown,
  })

  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['defects', 'trends'],
    queryFn: defectService.getTrends,
  })

  const stats = analytics?.data

  const severityData = stats ? [
    { name: 'Critical', value: stats.critical, color: '#ef4444' },
    { name: 'High', value: stats.high, color: '#f97316' },
    { name: 'Medium', value: stats.medium, color: '#eab308' },
    { name: 'Low', value: stats.low, color: '#3b82f6' },
  ] : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Defect Intelligence Center"
        subtitle="Unified tracking and risk scoring for Engineering, S&T, and Traction defects."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Defects', href: '/defects' },
          { label: 'Dashboard' },
        ]}
      />

      {analyticsLoading ? (
        <DashboardSkeleton />
      ) : !stats ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 text-sm text-red-700">
          Failed to load defect analytics.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/defects/list">
            <MetricCard
              title="Open Defects"
              value={stats.open_defects}
              change="Total unresolved"
              trend="neutral"
              icon={<Bug className="w-4 h-4" />}
              status="warning"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/critical">
            <MetricCard
              title="Critical Severity"
              value={stats.critical}
              change={stats.critical > 0 ? "Immediate action required" : "All clear"}
              trend={stats.critical > 0 ? "up" : "down"}
              icon={<ShieldAlert className="w-4 h-4" />}
              status={stats.critical > 0 ? "danger" : "success"}
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/list?severity=HIGH">
            <MetricCard
              title="High Severity"
              value={stats.high}
              change="Elevated risk"
              trend="up"
              icon={<AlertTriangle className="w-4 h-4" />}
              status="warning"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/overdue">
            <MetricCard
              title="Overdue Resolution"
              value={stats.overdue}
              change="SLA breached"
              trend="up"
              icon={<Clock className="w-4 h-4" />}
              status={stats.overdue > 0 ? "danger" : "success"}
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/list">
            <MetricCard
              title="New Today"
              value={stats.new_today}
              change="Detected last 24h"
              trend="neutral"
              icon={<Activity className="w-4 h-4" />}
              status="info"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/list">
            <MetricCard
              title="Medium Severity"
              value={stats.medium}
              change="Monitor"
              trend="neutral"
              icon={<Layers className="w-4 h-4" />}
              status="info"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/list">
            <MetricCard
              title="Low Severity"
              value={stats.low}
              change="Routine"
              trend="down"
              icon={<Layers className="w-4 h-4" />}
              status="success"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>

          <Link to="/defects/list?status=RESOLVED">
            <MetricCard
              title="Resolved (7d)"
              value={stats.resolved}
              change="Recently fixed"
              trend="up"
              icon={<CheckCircle className="w-4 h-4" />}
              status="success"
              className="hover:shadow-md transition-shadow cursor-pointer"
            />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Defect volumes by ownership</span>
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
                    <Bar dataKey="open" name="Open" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="high" name="High" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="overdue" name="Overdue" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="resolved" name="Resolved" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-56 w-full">
              {analyticsLoading ? (
                <Skeleton className="h-full w-full rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4 w-full px-4">
              {severityData.map(item => (
                <div key={item.name} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Detection vs Resolution Trend</CardTitle>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Last 7 Days</span>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            {trendsLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : !trends?.data?.length ? (
              <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
                No trend data available
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="detected" name="Detected" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DefectDashboard
