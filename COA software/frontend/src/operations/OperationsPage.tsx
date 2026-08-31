import { useState } from 'react'
import { Train, Search, AlertTriangle, Clock } from 'lucide-react'
import { cn, priorityColor, healthColor, formatDate, timeAgo } from '../shared/utils'
import { mockAssets, mockTasks } from '../shared/mockData'

type Tab = 'assets' | 'tasks'

export default function OperationsPage() {
  const [tab, setTab] = useState<Tab>('assets')
  const [search, setSearch] = useState('')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Train className="w-6 h-6 text-cyan-400" />
          Operations
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage railway assets and maintenance tasks across all departments.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('assets')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            tab === 'assets'
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          Assets
        </button>
        <button
          onClick={() => setTab('tasks')}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            tab === 'tasks'
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          Maintenance Tasks
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={`Search ${tab}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      </div>

      {/* Assets Table */}
      {tab === 'assets' && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dept</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Health</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Criticality</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Maintained</th>
                </tr>
              </thead>
              <tbody>
                {mockAssets
                  .filter(
                    (a) =>
                      !search ||
                      a.name.toLowerCase().includes(search.toLowerCase()) ||
                      a.id.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((asset) => (
                    <tr
                      key={asset.id}
                      className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{asset.id}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{asset.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300">
                          {asset.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-700 overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', asset.health_score >= 90 ? 'bg-emerald-500' : asset.health_score >= 70 ? 'bg-yellow-500' : asset.health_score >= 50 ? 'bg-orange-500' : 'bg-red-500')}
                              style={{ width: `${asset.health_score}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-medium', healthColor(asset.health_score))}>
                            {asset.health_score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded border uppercase',
                            priorityColor(asset.criticality as any)
                          )}
                        >
                          {asset.criticality}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{asset.location}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(asset.last_maintained)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      {tab === 'tasks' && (
        <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Dept</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody>
                {mockTasks
                  .filter(
                    (t) =>
                      !search ||
                      t.description.toLowerCase().includes(search.toLowerCase()) ||
                      t.id.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{task.id}</td>
                      <td className="px-4 py-3 text-slate-200 font-medium">{task.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300">
                          {task.department}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-[10px] font-bold rounded border uppercase',
                            priorityColor(task.priority)
                          )}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.duration_minutes} min
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {task.is_overdue ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            OVERDUE
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            ON TRACK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">{timeAgo(task.created_at)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
