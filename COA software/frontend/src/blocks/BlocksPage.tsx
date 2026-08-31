import React, { useState } from 'react'
import { Boxes, Filter, Plus, Clock, Train, CheckCircle2, XCircle, Hourglass } from 'lucide-react'
import { cn, statusColor, formatDateTime } from '../shared/utils'
import { mockBlockPlans } from '../shared/mockData'
import type { BlockStatus } from '../types/block'

const statusFilters: (BlockStatus | 'ALL')[] = ['ALL', 'PENDING', 'APPROVED', 'EXECUTED', 'RECOMMENDED', 'REJECTED']

const statusIcons: Record<string, React.ElementType> = {
  PENDING: Hourglass,
  APPROVED: CheckCircle2,
  EXECUTED: CheckCircle2,
  RECOMMENDED: Clock,
  REJECTED: XCircle,
}

export default function BlocksPage() {
  const [filter, setFilter] = useState<BlockStatus | 'ALL'>('ALL')

  const filtered =
    filter === 'ALL'
      ? mockBlockPlans
      : mockBlockPlans.filter((b) => b.status === filter)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-purple-400" />
            Block Plans
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            View and manage all scheduled and recommended maintenance blocks.
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors">
          <Plus className="w-4 h-4" />
          New Block
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === s
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700/30 hover:border-slate-600/50'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Block Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((plan) => {
          const statusKey = (plan.status || 'PENDING') as string
          const StatusIcon = (statusIcons as any)[statusKey] || Clock

          return (
            <div
              key={plan.id}
              className="group rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 hover:border-slate-600/60 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-slate-500">{plan.id}</span>
                <span
                  className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                    statusColor(statusKey)
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusKey}
                </span>
              </div>

              {/* Corridor */}
              <h3 className="text-lg font-semibold text-white mb-3">
                {plan.corridor}
              </h3>

              {/* Details */}
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDateTime(plan.start_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDateTime(plan.end_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Train className="w-3.5 h-3.5" />
                  <span>{plan.train_impact} trains affected</span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                <span className="text-xs text-slate-500">
                  {(Array.isArray(plan.tasks_included) ? plan.tasks_included.length : plan.tasks_included) || 0} tasks · {plan.downtime_saved_minutes} min saved
                </span>
                <button className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  Details →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Boxes className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No block plans match the current filter.</p>
        </div>
      )}
    </div>
  )
}
