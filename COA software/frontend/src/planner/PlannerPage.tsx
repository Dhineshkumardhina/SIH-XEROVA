import { useState, useEffect } from 'react'
import {
  Calendar,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { cn, priorityColor, formatDateTime } from '../shared/utils'
import type { MaintenanceTask } from '../types/maintenance'
import type { BlockPlan } from '../types/block'
import { useTaskStore } from '../shared/store'

// ── Task Row ────────────────────────────────────────────────────────

function TaskRow({
  task,
  selected,
  onToggle,
}: {
  task: MaintenanceTask
  selected: boolean
  onToggle: () => void
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200',
        selected
          ? 'bg-blue-500/10 border-blue-500/30'
          : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/40 bg-slate-700"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate">
          {task.description}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          {task.department} · {task.asset_id} · {task.duration_minutes} min
        </p>
      </div>
      <span
        className={cn(
          'px-2 py-0.5 text-[10px] font-bold rounded border uppercase flex-shrink-0',
          priorityColor(task.priority)
        )}
      >
        {task.priority}
      </span>
    </label>
  )
}

// ── Planner Page ────────────────────────────────────────────────────

export default function PlannerPage() {
  const { tasks, loading, fetchTasks } = useTaskStore()
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [corridor, setCorridor] = useState('Section A-B')
  const [optimizing, setOptimizing] = useState(false)
  const [result, setResult] = useState<BlockPlan | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const toggleTask = (id: string) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleOptimize = () => {
    setOptimizing(true)
    // Simulate AI optimization delay
    setTimeout(() => {
      setResult({
        id: 'BP-AI-GEN',
        corridor,
        corridor_id: 'C-NDLS-CNB',
        start_time: new Date(Date.now() + 3600000).toISOString(),
        end_time: new Date(Date.now() + 3600000 * 5).toISOString(),
        status: 'RECOMMENDED',
        tasks_included: Array.from(selectedTasks),
        train_impact: Math.floor(Math.random() * 3),
        downtime_saved_minutes:
          tasks
            .filter((t) => selectedTasks.has(t.id))
            .reduce((sum, t) => sum + t.duration_minutes, 0) * 0.3 | 0,
      })
      setOptimizing(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          Block Planner
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Select maintenance tasks, choose a corridor, and let AI find the optimal block window.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200">
                Available Maintenance Tasks
              </h2>
              <span className="text-xs text-slate-500">
                {selectedTasks.size} selected
              </span>
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    selected={selectedTasks.has(task.id)}
                    onToggle={() => toggleTask(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Config + Run */}
        <div className="space-y-4">
          {/* Corridor Selection */}
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">
              Block Configuration
            </h2>
            <label className="block mb-3">
              <span className="text-xs text-slate-400 block mb-1">Corridor / Section</span>
              <select
                value={corridor}
                onChange={(e) => setCorridor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                <option>Section A-B</option>
                <option>Station Bravo Yard</option>
                <option>Km 52 – Km 56</option>
                <option>Section C-D</option>
              </select>
            </label>
            <label className="block mb-3">
              <span className="text-xs text-slate-400 block mb-1">Max Train Impact</span>
              <input
                type="number"
                defaultValue={2}
                min={0}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>
            <label className="block mb-4">
              <span className="text-xs text-slate-400 block mb-1">Preferred Date</span>
              <input
                type="date"
                defaultValue="2026-09-01"
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>

            <button
              onClick={handleOptimize}
              disabled={selectedTasks.size === 0 || optimizing}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300',
                selectedTasks.size > 0 && !optimizing
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02]'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              )}
            >
              {optimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Optimizing…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run AI Optimization
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 p-5 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-semibold text-purple-300">
                  AI Optimized Plan
                </h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Corridor</span>
                  <span className="text-slate-200 font-medium">{result.corridor}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Window</span>
                  <span className="text-slate-200 font-medium text-right text-xs">
                    {formatDateTime(result.start_time)}
                    <br />→ {formatDateTime(result.end_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tasks Batched</span>
                  <span className="text-slate-200 font-medium">
                    {(Array.isArray(result.tasks_included) ? result.tasks_included.length : result.tasks_included) || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Train Impact</span>
                  <span className={cn('font-medium', result.train_impact === 0 ? 'text-emerald-400' : 'text-yellow-400')}>
                    {result.train_impact} trains
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Downtime Saved</span>
                  <span className="text-emerald-400 font-medium">{result.downtime_saved_minutes} min</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  Approve
                </button>
                <button className="flex-1 px-3 py-2 rounded-lg bg-slate-700/50 text-slate-400 text-xs font-medium hover:bg-slate-700 transition-colors">
                  Modify
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
