import { useEffect } from 'react'
import {
  Activity,
  Boxes,
  AlertTriangle,
  Clock,
  TrendingUp,
  Sparkles,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
// import { useLocation } from 'react-router-dom'; // unused
import { cn, priorityColor, timeAgo } from '../shared/utils'
import { mockAvailabilityTrend, mockDeptBreakdown } from '../shared/mockData'
import { useDashboardStore } from '../shared/store'
import DemoWizard from '../components/DemoWizard'
import StartDemoButton from '../components/StartDemoButton'

// ── Stat Card ───────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  trend?: string
  color: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-gray-200 p-5">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              color.replace('bg-', 'bg-').replace('500', '500/15')
            )}
          >
            <Icon className={cn('w-4 h-4', color.replace('bg-', 'text-'))} />
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-800 tracking-tight">{value}</p>
        {trend && (
          <div className="flex items-center gap-1 mt-2 text-gray-600 text-xs">
            <TrendingUp className="w-3 h-3" /> {trend}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ──────────────────────────────────────────────────

export default function DashboardPage() {
  const { stats, recommendations, priorityTasks, loading, fetchAll } = useDashboardStore()

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Loading Dashboard Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <DemoWizard />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            RAILOPT-AI Command Center — Real-time overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-green-700">System Online</span>
        </div>
      </div>
        <StartDemoButton />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Asset Availability"
          value={`${stats.asset_availability}%`}
          icon={Activity}
          trend="+1.2% from yesterday"
          color="bg-blue-500"
        />
        <StatCard
          label="Active Blocks"
          value={stats.active_blocks}
          icon={Boxes}
          color="bg-purple-500"
        />
        <StatCard
          label="Critical Defects"
          value={stats.critical_defects}
          icon={AlertTriangle}
          trend="-2 this week"
          color="bg-red-500"
        />
        <StatCard
          label="Overdue Tasks"
          value={stats.overdue_tasks}
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Availability Trend */}
        <div className="lg:col-span-2 rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            Asset Availability Trend
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockAvailabilityTrend}>
              <defs>
                <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis domain={[92, 100]} stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="availability"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#availGrad)"
              />
              <Area
                type="monotone"
                dataKey="target"
                stroke="#f59e0b"
                strokeWidth={1}
                strokeDasharray="5 5"
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Breakdown */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            Tasks by Department
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockDeptBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#64748b"
                fontSize={12}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="completed" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="overdue" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* AI Recommendations */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-200">
              AI Recommendations
            </h2>
          </div>
          <div className="space-y-3">
            {recommendations.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {plan.corridor}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(Array.isArray(plan.tasks_included) ? plan.tasks_included.length : plan.tasks_included) || 0} tasks · {plan.downtime_saved_minutes} min saved · {plan.train_impact} trains affected
                    </p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors">
                    Review
                  </button>
                </div>
              ))}
            {recommendations.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-6">
                No new recommendations
              </p>
            )}
          </div>
        </div>

        {/* Priority Tasks */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            Priority Tasks
          </h2>
          <div className="space-y-2">
            {priorityTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[10px] font-bold rounded border uppercase',
                        priorityColor(task.priority)
                      )}
                    >
                      {task.priority}
                    </span>
                    <div>
                      <p className="text-sm text-slate-200">{task.description}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {task.department} · {task.asset_id} · {timeAgo(task.created_at)}
                      </p>
                    </div>
                  </div>
                  {task.is_overdue && (
                    <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                      OVERDUE
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
