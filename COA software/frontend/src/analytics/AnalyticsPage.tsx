import {
  BarChart3,
  TrendingUp,
  Clock,
  Gauge,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { mockAvailabilityTrend, mockDeptBreakdown, mockBlockUtilization } from '../shared/mockData'

const PIE_COLORS = ['#3b82f6', '#a855f7', '#22c55e', '#f59e0b']

const deptPieData = mockDeptBreakdown.map((d) => ({
  name: d.name,
  value: d.tasks,
}))

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-emerald-400" />
          Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Performance metrics, utilization reports, and department-wise analytics.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avg Availability', value: '96.5%', icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Blocks This Week', value: '8', icon: Clock, color: 'text-purple-400' },
          { label: 'Efficiency Rate', value: '85.9%', icon: Gauge, color: 'text-emerald-400' },
          { label: 'Tasks Completed', value: '21', icon: BarChart3, color: 'text-orange-400' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p className="text-xl font-bold text-white">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Availability Trend */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            Weekly Availability Trend
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockAvailabilityTrend}>
              <defs>
                <linearGradient id="analyticGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
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
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#analyticGrad)"
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

        {/* Department Task Distribution */}
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
          <h2 className="text-sm font-semibold text-slate-200 mb-4">
            Task Distribution by Department
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={deptPieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
              >
                {deptPieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Block Utilization Table */}
      <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">
          Block Utilization Report
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Corridor
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Planned (min)
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actual (min)
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Efficiency
                </th>
              </tr>
            </thead>
            <tbody>
              {mockBlockUtilization.map((row) => (
                <tr
                  key={row.name}
                  className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-4 py-3 text-slate-200 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-slate-400">{row.planned}</td>
                  <td className="px-4 py-3 text-slate-400">{row.actual}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.efficiency >= 90
                              ? 'bg-emerald-500'
                              : row.efficiency >= 75
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${row.efficiency}%` }}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          row.efficiency >= 90
                            ? 'text-emerald-400'
                            : row.efficiency >= 75
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {row.efficiency}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
