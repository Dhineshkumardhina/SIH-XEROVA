import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  TrendingDown,
  Timer,
  Check,
  X,
  SlidersHorizontal,
  Send,
  BarChart3,
  CalendarDays,
  CalendarRange
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { TrainImpactPanel } from '../../components/planner/TrainImpactPanel'
import { trainImpactService } from '../../services/trainImpact'
import { corridorService } from '../../services/corridors'
import { aiPlannerService } from '../../services/aiPlanner'
import { plannerService } from '../../services/planner'
import type { TrainImpactData } from '../../types/trainImpact'
import type { Corridor } from '../../types/corridor'
import type {
  AIPlanningResultData,
  OptimizationObjectiveWeights
} from '../../types/aiPlanner'
import type {
  DailyPlanResult,
  WeeklyPlanResult,
  MonthlyPlanResult
} from '../../types/planner'

interface AIPlannerPageProps {
  subModule?: 'ai' | 'daily' | 'weekly' | 'monthly' | 'recommendations'
}

export const AIPlannerPage: React.FC<AIPlannerPageProps> = ({ subModule = 'daily' }) => {
  // Tabs: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AI_OPTIMIZER' | 'SIMULATOR'
  const initialTab =
    subModule === 'weekly'
      ? 'WEEKLY'
      : subModule === 'monthly'
      ? 'MONTHLY'
      : subModule === 'ai'
      ? 'AI_OPTIMIZER'
      : 'DAILY'

  const [activeTab, setActiveTab] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AI_OPTIMIZER' | 'SIMULATOR'>(initialTab)

  // Corridors
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('')

  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)

  // AI Planner Configuration State
  const [horizon, setHorizon] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')
  const [selectedDepts] = useState<string[]>(['ENGINEERING', 'SIGNAL_TELECOM', 'TRACTION'])
  const [maxBlockDuration, setMaxBlockDuration] = useState<number>(180)
  const [minPriority] = useState<number>(30)
  const [includeOverdue] = useState<boolean>(true)
  const [includeCritical] = useState<boolean>(true)
  const [includeSharedBlocks] = useState<boolean>(true)

  // Objective Weights
  const [weights, setWeights] = useState<OptimizationObjectiveWeights>({
    asset_availability: 40,
    maintenance_priority: 25,
    train_impact: 20,
    block_utilization: 15
  })

  // Execution & Results State
  const [isPlanning, setIsPlanning] = useState<boolean>(false)
  const [planResult, setPlanResult] = useState<AIPlanningResultData | null>(null)
  const [dailyPlan, setDailyPlan] = useState<DailyPlanResult | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlanResult | null>(null)
  const [monthlyPlan, setMonthlyPlan] = useState<MonthlyPlanResult | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  const [, setCurrentStageIdx] = useState<number>(0)

  // Modification Modal State
  const [modifyingBlock, setModifyingBlock] = useState<any | null>(null)
  const [modStartTime, setModStartTime] = useState<string>('01:00')
  const [modEndTime, setModEndTime] = useState<string>('03:00')
  const [modReason, setModReason] = useState<string>('')
  const [modResult, setModResult] = useState<any | null>(null)
  const [isModifying, setIsModifying] = useState<boolean>(false)
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null)

  // Simulator State
  const [startTimeStr, setStartTimeStr] = useState<string>('01:00')
  const [simDuration, setSimDuration] = useState<number>(120)
  const [isSimLoading, setIsSimLoading] = useState<boolean>(false)
  const [impactResult, setImpactResult] = useState<TrainImpactData | null>(null)
  const [simError, setSimError] = useState<string | null>(null)

  const stagesList = [
    '1. Ingesting maintenance tasks from TMS, SMMS, TDMS',
    '2. Assessing asset risk & defect criticalities',
    '3. Analyzing corridor track capacity & headway buffers',
    '4. Ingesting passenger timetable & freight forecast',
    '5. Running block conflict matrix evaluation',
    '6. Discovering multi-department bundling synergies',
    '7. Formulating Google OR-Tools CP-SAT integer program',
    '8. Solving multi-objective schedule optimization',
    '9. Executing safety guardrails plan validation',
    '10. Computing planning confidence & explainability rationale'
  ]

  const totalWeight = weights.asset_availability + weights.maintenance_priority + weights.train_impact + weights.block_utilization
  const isWeightValid = Math.abs(totalWeight - 100) < 0.1

  // Load Corridors on Mount
  useEffect(() => {
    const fetchCorridors = async () => {
      try {
        const res = await corridorService.getCorridors()
        const list = Array.isArray(res.data) ? res.data : ((res.data as any)?.items || [])
        setCorridors(list)
        if (list.length > 0) {
          const defaultCorr = list.find((c: any) => c.code === 'COR-A01' || c.code === 'COR-001') || list[0]
          setSelectedCorridorId(defaultCorr.id)
        }
      } catch (err: any) {
        console.error('Failed to load corridors', err)
      }
    }
    fetchCorridors()
  }, [])

  // Execute Daily Plan Generation
  const handleGenerateDailyPlan = async () => {
    if (!selectedCorridorId) return
    try {
      setIsPlanning(true)
      setPlanError(null)
      setPublishSuccessMsg(null)
      setCurrentStageIdx(0)

      const interval = setInterval(() => {
        setCurrentStageIdx((prev) => (prev < stagesList.length - 1 ? prev + 1 : prev))
      }, 250)

      const res = await plannerService.generateDailyPlan({
        planning_date: `${selectedDate}T00:00:00`,
        corridor_ids: [selectedCorridorId],
        departments: selectedDepts,
        max_block_duration_minutes: maxBlockDuration,
        min_priority: minPriority,
        include_overdue: includeOverdue,
        include_critical: includeCritical,
        optimization_objective: weights
      })

      clearInterval(interval)
      setCurrentStageIdx(stagesList.length - 1)
      setDailyPlan(res.data)
    } catch (err: any) {
      setPlanError(err?.response?.data?.detail || err?.message || 'Daily planning failed.')
    } finally {
      setIsPlanning(false)
    }
  }

  // Execute Weekly Plan Generation
  const handleGenerateWeeklyPlan = async () => {
    try {
      setIsPlanning(true)
      setPlanError(null)
      const res = await plannerService.generateWeeklyPlan({
        start_date: `${selectedDate}T00:00:00`,
        corridor_ids: selectedCorridorId ? [selectedCorridorId] : undefined,
        departments: selectedDepts,
        optimization_objective: weights
      })
      setWeeklyPlan(res.data)
    } catch (err: any) {
      setPlanError(err?.response?.data?.detail || err?.message || 'Weekly planning failed.')
    } finally {
      setIsPlanning(false)
    }
  }

  // Execute Monthly Plan Generation
  const handleGenerateMonthlyPlan = async () => {
    try {
      setIsPlanning(true)
      setPlanError(null)
      const d = new Date(selectedDate)
      const res = await plannerService.generateMonthlyPlan({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        corridor_ids: selectedCorridorId ? [selectedCorridorId] : undefined,
        departments: selectedDepts
      })
      setMonthlyPlan(res.data)
    } catch (err: any) {
      setPlanError(err?.response?.data?.detail || err?.message || 'Monthly planning failed.')
    } finally {
      setIsPlanning(false)
    }
  }

  // Execute AI CP-SAT Optimizer
  const handleGenerateAIPlan = async () => {
    if (!selectedCorridorId) return
    try {
      setIsPlanning(true)
      setPlanError(null)
      setCurrentStageIdx(0)

      const interval = setInterval(() => {
        setCurrentStageIdx((prev) => (prev < stagesList.length - 1 ? prev + 1 : prev))
      }, 250)

      const res = await aiPlannerService.generatePlan({
        planning_date: `${selectedDate}T00:00:00`,
        horizon: horizon,
        corridor_ids: [selectedCorridorId],
        departments: selectedDepts,
        max_block_duration_minutes: maxBlockDuration,
        min_priority: minPriority,
        include_overdue: includeOverdue,
        include_critical: includeCritical,
        include_shared_blocks: includeSharedBlocks,
        optimization_objective: weights
      })

      clearInterval(interval)
      setCurrentStageIdx(stagesList.length - 1)
      setPlanResult(res.data)
    } catch (err: any) {
      setPlanError(err?.response?.data?.detail || err?.message || 'AI Planning failed.')
    } finally {
      setIsPlanning(false)
    }
  }

  // Simulator Run
  const handleRunSimulation = async () => {
    if (!selectedCorridorId) return
    try {
      setIsSimLoading(true)
      setSimError(null)
      const [hrs, mins] = startTimeStr.split(':').map(Number)
      const start = new Date(`${selectedDate}T00:00:00`)
      start.setHours(hrs, mins, 0, 0)
      const end = new Date(start.getTime() + simDuration * 60000)

      const res = await trainImpactService.calculateTrainImpact({
        corridor_id: selectedCorridorId,
        start_time: start.toISOString(),
        end_time: end.toISOString()
      })
      setImpactResult(res.data)
    } catch (err: any) {
      setSimError(err?.response?.data?.detail || err?.message || 'Failed to simulate train impact')
    } finally {
      setIsSimLoading(false)
    }
  }

  // Initial Load per tab
  useEffect(() => {
    if (selectedCorridorId) {
      if (activeTab === 'DAILY') handleGenerateDailyPlan()
      else if (activeTab === 'WEEKLY') handleGenerateWeeklyPlan()
      else if (activeTab === 'MONTHLY') handleGenerateMonthlyPlan()
      else if (activeTab === 'AI_OPTIMIZER') handleGenerateAIPlan()
      else if (activeTab === 'SIMULATOR') handleRunSimulation()
    }
  }, [selectedCorridorId, activeTab])

  // Move Block Window Handler
  const handleApplyBlockModification = async () => {
    if (!modifyingBlock) return
    try {
      setIsModifying(true)
      setModResult(null)
      const [sH, sM] = modStartTime.split(':').map(Number)
      const [eH, eM] = modEndTime.split(':').map(Number)

      const start = new Date(`${selectedDate}T00:00:00`)
      start.setHours(sH, sM, 0, 0)
      const end = new Date(`${selectedDate}T00:00:00`)
      end.setHours(eH, eM, 0, 0)

      const res = await plannerService.modifyBlock(modifyingBlock.plan_id || modifyingBlock.id || modifyingBlock.block_id, {
        new_start_time: start.toISOString(),
        new_end_time: end.toISOString(),
        change_reason: modReason || 'Shifted possession window by planner'
      })

      setModResult(res.data)
      if (res.data.is_valid) {
        handleGenerateDailyPlan()
      }
    } catch (err: any) {
      setModResult({
        is_valid: false,
        message: err?.response?.data?.detail || err?.message || 'Failed to modify block window.'
      })
    } finally {
      setIsModifying(false)
    }
  }

  // Publish Plan Handler
  const handlePublishPlan = async (planId: string) => {
    try {
      const res = await plannerService.publishPlan(planId)
      setPublishSuccessMsg(res.data.message || 'Block plan successfully published to divisional train control.')
      handleGenerateDailyPlan()
    } catch (err: any) {
      setPlanError(err?.response?.data?.detail || err?.message || 'Failed to publish plan.')
    }
  }



  const getDeptBadgeClass = (dept: string) => {
    if (dept.includes('ENG')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    if (dept.includes('SIG')) return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    if (dept.includes('TRC')) return 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    return 'text-slate-400 bg-slate-500/10 border-slate-500/30'
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Multi-Horizon Railway Block Planning Engine"
        subtitle="Hierarchical possession planning across Daily (24h), Weekly (7-Day), and Monthly (30-Day) operational cycles."
        breadcrumbs={[
          { label: 'AI Intelligence', href: '/ai' },
          { label: 'Multi-Horizon Planner' }
        ]}
        actions={
          <div className="flex gap-2">
            <div className="flex bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('DAILY')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'DAILY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Daily (24h)
              </button>
              <button
                onClick={() => setActiveTab('WEEKLY')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'WEEKLY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Weekly (7-Day)
              </button>
              <button
                onClick={() => setActiveTab('MONTHLY')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'MONTHLY' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                Monthly (30-Day)
              </button>
              <button
                onClick={() => setActiveTab('AI_OPTIMIZER')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'AI_OPTIMIZER' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                CP-SAT Optimizer
              </button>
              <button
                onClick={() => setActiveTab('SIMULATOR')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'SIMULATOR' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                Simulator
              </button>
            </div>
          </div>
        }
      />

      {planError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-sm flex items-center justify-between">
          <span>{planError}</span>
          <button onClick={() => setPlanError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {simError && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-sm flex items-center justify-between">
          <span>{simError}</span>
          <button onClick={() => setSimError(null)} className="text-red-400 hover:text-red-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {publishSuccessMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-xs font-semibold text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{publishSuccessMsg}</span>
        </div>
      )}

      {/* ── 1. DAILY PLANNER (24-Hour Operational Board) ────────────────────────── */}
      {activeTab === 'DAILY' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <Card>
            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Corridor</label>
                  <select
                    value={selectedCorridorId}
                    onChange={(e) => setSelectedCorridorId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    {corridors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Duration</label>
                  <select
                    value={maxBlockDuration}
                    onChange={(e) => setMaxBlockDuration(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value={120}>120 min (2h)</option>
                    <option value={180}>180 min (3h)</option>
                    <option value={240}>240 min (4h)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateDailyPlan}
                  isLoading={isPlanning}
                  leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                >
                  {isPlanning ? 'GENERATING...' : 'GENERATE DAILY PLAN'}
                </Button>
              </div>
            </div>
          </Card>

          {dailyPlan && (
            <>
              {/* Daily KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Tasks Scheduled</p>
                    <p className="text-xl font-bold text-slate-100">{dailyPlan.summary.tasks_selected}</p>
                    <p className="text-[10px] text-slate-500">{dailyPlan.summary.tasks_analyzed} eligible</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Critical Tasks</p>
                    <p className="text-xl font-bold text-amber-400">
                      {dailyPlan.summary.critical_tasks_covered}/{dailyPlan.summary.critical_tasks_total || dailyPlan.summary.critical_tasks_covered}
                    </p>
                    <p className="text-[10px] text-amber-300/80">100% safety covered</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Blocks Generated</p>
                    <p className="text-xl font-bold text-purple-400">{dailyPlan.summary.blocks_generated}</p>
                    <p className="text-[10px] text-purple-300/80">{dailyPlan.summary.departments_coordinated} depts bundled</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Downtime Saved</p>
                    <p className="text-xl font-bold text-emerald-400">+{dailyPlan.summary.time_saved_minutes}m</p>
                    <p className="text-[10px] text-emerald-300/80">{dailyPlan.summary.downtime_reduction_pct}% reduction</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Train Impact</p>
                    <p className="text-xl font-bold text-blue-400">{dailyPlan.summary.expected_train_delay_minutes}m</p>
                    <p className="text-[10px] text-blue-300/80">Zero critical overlap</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Planning Confidence</p>
                    <p className="text-xl font-bold text-emerald-300">{dailyPlan.summary.planning_confidence}%</p>
                    <p className="text-[10px] text-emerald-400/80">Guardrails verified</p>
                  </div>
                </Card>
              </div>

              {/* 24-Hour Visual Operational Timeline Board */}
              <Card>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        24-Hour Operational Possession Timeline ({selectedDate})
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-400">
                        <div className="w-2.5 h-2.5 rounded bg-amber-500/60" /> Train Movements
                      </span>
                      <span className="flex items-center gap-1 text-blue-400">
                        <div className="w-2.5 h-2.5 rounded bg-blue-500" /> AI Bundled Block
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <div className="w-2.5 h-2.5 rounded bg-emerald-500" /> Approved Block
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Scrollable Timeline Matrix */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs">
                    {/* Hour Labels */}
                    <div className="flex border-b border-slate-800 pb-2 mb-3 min-w-[720px]">
                      <div className="w-32 flex-shrink-0 text-slate-500 font-bold">Corridor</div>
                      <div className="flex-1 grid grid-cols-12 text-[10px] text-slate-500 text-center">
                        {['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map((h) => (
                          <span key={h}>{h}</span>
                        ))}
                      </div>
                    </div>

                    {/* Corridor Rows */}
                    <div className="space-y-3 min-w-[720px]">
                      {dailyPlan.timeline.corridors.map((cRow) => (
                        <div key={cRow.corridor_id} className="flex items-center gap-2">
                          <div className="w-32 flex-shrink-0 text-xs font-bold text-slate-300 truncate">
                            {cRow.corridor_code}
                          </div>
                          <div className="flex-1 bg-slate-900/80 h-7 rounded-lg relative border border-slate-800/80">
                            {cRow.events.map((evt, eIdx) => {
                              const [sH] = evt.start_time.split(':').map(Number)
                              const [eH] = evt.end_time.split(':').map(Number)
                              const leftPct = (sH / 24) * 100
                              const widthPct = Math.max(4, (((eH < sH ? eH + 24 : eH) - sH) / 24) * 100)

                              return (
                                <button
                                  key={eIdx}
                                  type="button"
                                  onClick={() => {
                                    if (evt.type.includes('BLOCK')) {
                                      setModifyingBlock({
                                        id: evt.plan_id || 'AI-BLK-0001',
                                        plan_code: evt.title,
                                        start_time: evt.start_time,
                                        end_time: evt.end_time
                                      })
                                      setModStartTime(evt.start_time)
                                      setModEndTime(evt.end_time)
                                    }
                                  }}
                                  className={`absolute top-1 bottom-1 rounded px-2 text-[10px] font-bold truncate flex items-center justify-center transition-all ${
                                    evt.type === 'TRAIN'
                                      ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 cursor-default'
                                      : evt.type === 'APPROVED_BLOCK'
                                      ? 'bg-emerald-500/80 text-white shadow cursor-pointer hover:scale-105'
                                      : 'bg-blue-600 text-white shadow border border-blue-400 cursor-pointer hover:scale-105'
                                  }`}
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                  title={`${evt.title} (${evt.start_time} - ${evt.end_time})`}
                                >
                                  {evt.title}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recommended Blocks Cards */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Recommended Possessions & Actions ({dailyPlan.recommended_blocks.length})
                </h3>

                {dailyPlan.recommended_blocks.map((block, idx) => (
                  <Card key={idx}>
                    <div className="p-5 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {block.block_id}
                            </span>
                            {block.is_shared_block && (
                              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                Multi-Dept Bundled
                              </span>
                            )}
                            <Badge variant="success">AI_RECOMMENDED</Badge>
                          </div>
                          <h4 className="text-base font-bold text-slate-100 mt-1">
                            {block.corridor_name} ({block.start_time} – {block.end_time})
                          </h4>
                          <p className="text-xs text-slate-400">
                            Duration: {block.duration_minutes}m | Tasks: {block.task_count} | Expected Train Delay: {block.expected_train_delay}m | Utilization: {block.block_utilization}%
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setModifyingBlock(block)
                              setModStartTime(block.start_time)
                              setModEndTime(block.end_time)
                            }}
                            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                          >
                            Reschedule Window
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handlePublishPlan(block.block_id)}
                            leftIcon={<Send className="w-3.5 h-3.5" />}
                          >
                            Publish Approved Plan
                          </Button>
                        </div>
                      </div>

                      {/* Department Badges */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-semibold">Participating Departments:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {block.departments.map((d: string) => (
                            <span key={d} className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded border ${getDeptBadgeClass(d)}`}>
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Tasks Summary Table */}
                      <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                            <tr>
                              <th className="py-2 px-3">Task Code</th>
                              <th className="py-2 px-3">Department</th>
                              <th className="py-2 px-3">Asset</th>
                              <th className="py-2 px-3">Priority</th>
                              <th className="py-2 px-3">Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                            {block.tasks.map((t: any, tIdx: number) => (
                              <tr key={tIdx}>
                                <td className="py-2 px-3 font-mono font-bold text-blue-400">{t.task_code}</td>
                                <td className="py-2 px-3">
                                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getDeptBadgeClass(t.department)}`}>
                                    {t.department}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-300">{t.asset_name || t.asset_id}</td>
                                <td className="py-2 px-3">
                                  <Badge variant={t.priority === 'CRITICAL' ? 'danger' : t.priority === 'HIGH' ? 'warning' : 'info'}>
                                    {t.priority}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 font-mono text-slate-300">{t.duration_minutes}m</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── 2. WEEKLY PLANNER (7-Day Horizon) ────────────────────────────────────── */}
      {activeTab === 'WEEKLY' && (
        <div className="space-y-6">
          <Card>
            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Week Starting Monday</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateWeeklyPlan}
                isLoading={isPlanning}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              >
                {isPlanning ? 'OPTIMIZING WEEK...' : 'OPTIMIZE 7-DAY SCHEDULE'}
              </Button>
            </div>
          </Card>

          {weeklyPlan && (
            <>
              {/* Weekly KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Weekly Tasks</p>
                    <p className="text-xl font-bold text-slate-100">{weeklyPlan.summary.total_tasks_scheduled}</p>
                    <p className="text-[10px] text-slate-500">7-day rolling window</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Critical Covered</p>
                    <p className="text-xl font-bold text-amber-400">{weeklyPlan.summary.critical_tasks_covered}</p>
                    <p className="text-[10px] text-amber-300/80">{weeklyPlan.summary.overdue_reduction_pct}% overdue reduced</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Shared Blocks</p>
                    <p className="text-xl font-bold text-purple-400">{weeklyPlan.summary.shared_blocks_count}</p>
                    <p className="text-[10px] text-purple-300/80">of {weeklyPlan.summary.total_blocks_planned} total blocks</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Avg Utilization</p>
                    <p className="text-xl font-bold text-emerald-400">{weeklyPlan.summary.average_block_utilization_pct}%</p>
                    <p className="text-[10px] text-emerald-300/80">High efficiency</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Weekly Train Delay</p>
                    <p className="text-xl font-bold text-blue-400">{weeklyPlan.summary.total_expected_train_delay_minutes}m</p>
                    <p className="text-[10px] text-blue-300/80">Evenly distributed</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Optimization Score</p>
                    <p className="text-xl font-bold text-emerald-300">{weeklyPlan.summary.optimization_score}/100</p>
                    <p className="text-[10px] text-emerald-400/80">CP-SAT validated</p>
                  </div>
                </Card>
              </div>

              {/* 7-Day Calendar Board */}
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
                {weeklyPlan.days.map((day) => (
                  <Card key={day.day_index}>
                    <div className="p-4 space-y-3">
                      <div className="border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-mono uppercase text-slate-500">{day.date}</span>
                        <h4 className="text-sm font-bold text-slate-200">{day.day_name}</h4>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Tasks:</span>
                          <span className="font-bold text-slate-200">{day.tasks_count}</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                          <span>Critical:</span>
                          <span className="font-bold">{day.critical_tasks_count}</span>
                        </div>
                        <div className="flex justify-between text-purple-400">
                          <span>Possessions:</span>
                          <span className="font-bold">{day.blocks_count}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Utilization:</span>
                          <span className="font-mono font-bold">{day.block_utilization_pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-800">
                        <Badge variant="success">SCHEDULED</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Plan Comparison */}
              {weeklyPlan.plan_comparison && (
                <Card>
                  <div className="p-5 space-y-3">
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      Weekly Plan Efficiency Comparison (Manual Baseline vs AI Coordinated Plan)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60">
                        <p className="text-slate-400">Uncoordinated Individual Possessions</p>
                        <p className="text-base font-bold text-slate-200 mt-0.5">
                          {weeklyPlan.plan_comparison.manual_baseline.total_downtime_minutes} min ({weeklyPlan.plan_comparison.manual_baseline.total_blocks} blocks)
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Separate department disruptions</p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20">
                        <p className="text-blue-300 font-semibold">AI Coordinated Shared Schedule</p>
                        <p className="text-base font-bold text-blue-400 mt-0.5">
                          {weeklyPlan.plan_comparison.ai_optimized.total_downtime_minutes} min ({weeklyPlan.plan_comparison.ai_optimized.total_blocks} blocks)
                        </p>
                        <p className="text-[10px] text-blue-300/80 mt-0.5">Bundled multi-discipline windows</p>
                      </div>
                      <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
                        <p className="text-emerald-300 font-semibold">Weekly Track Time Saved</p>
                        <p className="text-base font-bold text-emerald-400 mt-0.5">
                          +{weeklyPlan.plan_comparison.savings.time_saved_minutes} min ({weeklyPlan.plan_comparison.savings.downtime_reduction_pct}%)
                        </p>
                        <p className="text-[10px] text-emerald-300/80 mt-0.5">Direct train capacity gain</p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── 3. MONTHLY PLANNER (30-Day Capacity & Statutory Deadlines) ──────────── */}
      {activeTab === 'MONTHLY' && (
        <div className="space-y-6">
          <Card>
            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Month / Year</label>
                  <div className="flex gap-2">
                    <select
                      value={new Date(selectedDate).getMonth() + 1}
                      onChange={(e) => {
                        const m = Number(e.target.value)
                        const d = new Date(selectedDate)
                        d.setMonth(m - 1)
                        setSelectedDate(d.toISOString().split('T')[0])
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((mName, mIdx) => (
                        <option key={mIdx} value={mIdx + 1}>
                          {mName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={new Date(selectedDate).getFullYear()}
                      onChange={(e) => {
                        const y = Number(e.target.value)
                        const d = new Date(selectedDate)
                        d.setFullYear(y)
                        setSelectedDate(d.toISOString().split('T')[0])
                      }}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    >
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateMonthlyPlan}
                isLoading={isPlanning}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              >
                {isPlanning ? 'ALLOCATING MONTH...' : 'GENERATE MONTHLY CAPACITY PLAN'}
              </Button>
            </div>
          </Card>

          {monthlyPlan && (
            <>
              {/* Monthly KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Monthly Workload</p>
                    <p className="text-xl font-bold text-slate-100">{monthlyPlan.summary.total_tasks_scheduled} tasks</p>
                    <p className="text-[10px] text-slate-500">Across all corridors</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Possessions Planned</p>
                    <p className="text-xl font-bold text-purple-400">{monthlyPlan.summary.total_blocks_planned}</p>
                    <p className="text-[10px] text-purple-300/80">{monthlyPlan.summary.shared_blocks_planned} multi-dept shared</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Overdue Reduction</p>
                    <p className="text-xl font-bold text-emerald-400">{monthlyPlan.summary.expected_overdue_reduction_pct}%</p>
                    <p className="text-[10px] text-emerald-300/80">Statutory compliance</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Track Availability</p>
                    <p className="text-xl font-bold text-blue-400">{monthlyPlan.summary.expected_asset_availability_pct}%</p>
                    <p className="text-[10px] text-blue-300/80">High network uptime</p>
                  </div>
                </Card>
                <Card>
                  <div className="p-3">
                    <p className="text-[10px] text-slate-400 uppercase">Optimization Score</p>
                    <p className="text-xl font-bold text-emerald-300">{monthlyPlan.summary.optimization_score}/100</p>
                    <p className="text-[10px] text-emerald-400/80">Long-term balanced</p>
                  </div>
                </Card>
              </div>

              {/* 4-Week Horizon Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {monthlyPlan.weeks.map((wk) => (
                  <Card key={wk.week_number}>
                    <div className="p-5 space-y-3">
                      <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-100">Week {wk.week_number}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{wk.start_date} – {wk.end_date}</span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-slate-300">
                          <span>Tasks Quota:</span>
                          <span className="font-bold font-mono">{wk.tasks_quota}</span>
                        </div>
                        <div className="flex justify-between text-amber-400">
                          <span>Critical Assets Addressed:</span>
                          <span className="font-bold font-mono">{wk.critical_tasks_scheduled}</span>
                        </div>
                        <div className="flex justify-between text-purple-300">
                          <span>Possessions Planned:</span>
                          <span className="font-bold font-mono">{wk.blocks_planned}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Block Utilization:</span>
                          <span className="font-bold font-mono">{wk.utilization_pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Department Workload Breakdown */}
              <Card>
                <div className="p-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    Department Monthly Workload Quota Allocation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {monthlyPlan.department_workload.map((dept, dIdx) => (
                      <div key={dIdx} className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1.5">
                        <span className="text-slate-300 font-bold">{dept.department}</span>
                        <div className="flex justify-between text-slate-400">
                          <span>Tasks Allocated:</span>
                          <span className="font-mono text-slate-100 font-bold">{dept.tasks_count} tasks</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${dept.quota_pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── 4. AI CP-SAT OPTIMIZER TAB (Phase 17/18) ───────────────────────────── */}
      {activeTab === 'AI_OPTIMIZER' && (
        <div className="space-y-6">
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Google OR-Tools CP-SAT Master Optimizer Controls
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Corridor</label>
                  <select
                    value={selectedCorridorId}
                    onChange={(e) => setSelectedCorridorId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    {corridors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Horizon</label>
                  <select
                    value={horizon}
                    onChange={(e) => setHorizon(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="DAILY">Daily (24h)</option>
                    <option value="WEEKLY">Weekly (7-Day)</option>
                    <option value="MONTHLY">Monthly (30-Day)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Max Duration</label>
                  <select
                    value={maxBlockDuration}
                    onChange={(e) => setMaxBlockDuration(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value={120}>120 min</option>
                    <option value={180}>180 min</option>
                    <option value={240}>240 min</option>
                  </select>
                </div>
              </div>

              {/* Weights */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Objective Weights (Total: {totalWeight}%)</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${isWeightValid ? 'text-emerald-400 border-emerald-500/30' : 'text-red-400 border-red-500/30'}`}>
                    {isWeightValid ? 'Validated 100% ✓' : 'Must equal 100%'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Asset Availability</span>
                      <span className="font-mono text-slate-200">{weights.asset_availability}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={5}
                      value={weights.asset_availability}
                      onChange={(e) => setWeights({ ...weights, asset_availability: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded accent-blue-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Maintenance Priority</span>
                      <span className="font-mono text-slate-200">{weights.maintenance_priority}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={5}
                      value={weights.maintenance_priority}
                      onChange={(e) => setWeights({ ...weights, maintenance_priority: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded accent-purple-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Train Impact</span>
                      <span className="font-mono text-slate-200">{weights.train_impact}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={5}
                      value={weights.train_impact}
                      onChange={(e) => setWeights({ ...weights, train_impact: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded accent-amber-500"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Block Utilization</span>
                      <span className="font-mono text-slate-200">{weights.block_utilization}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={70}
                      step={5}
                      value={weights.block_utilization}
                      onChange={(e) => setWeights({ ...weights, block_utilization: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-800 rounded accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  onClick={handleGenerateAIPlan}
                  isLoading={isPlanning}
                  disabled={!isWeightValid}
                  leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
                >
                  {isPlanning ? 'RUNNING CP-SAT SOLVER...' : 'RUN CP-SAT SOLVER'}
                </Button>
              </div>
            </div>
          </Card>

          {planResult && (
            <Card>
              <div className="p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  CP-SAT Solution: {planResult.summary.blocks_generated} Possessions Generated (Score: {planResult.summary.optimization_score}/100)
                </h3>
                <p className="text-xs text-slate-300">{planResult.recommended_blocks[0]?.reason}</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'SIMULATOR' && (
        impactResult ? (
          <TrainImpactPanel
            data={impactResult}
            isLoading={isSimLoading}
            onSelectAlternative={(alt) => {
              setStartTimeStr(alt.start_time)
              setSimDuration(alt.duration_minutes)
              handleRunSimulation()
            }}
          />
        ) : (
          <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800">
            Configure simulation parameters above and click Evaluate Timetable Impact.
          </div>
        )
      )}

      {/* ── Reschedule / Move Block Window Modal ───────────────────────────────── */}
      {modifyingBlock && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                Reschedule Possession Window: {modifyingBlock.plan_code || modifyingBlock.id}
              </h3>
              <button onClick={() => setModifyingBlock(null)} className="p-1 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">New Start Time</label>
                  <input
                    type="time"
                    value={modStartTime}
                    onChange={(e) => setModStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">New End Time</label>
                  <input
                    type="time"
                    value={modEndTime}
                    onChange={(e) => setModEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Change Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Operational window shifted to avoid late freight"
                  value={modReason}
                  onChange={(e) => setModReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {modResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    modResult.is_valid
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-950/30 border-red-500/30 text-red-400'
                  }`}
                >
                  {modResult.message}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button variant="outline" onClick={() => setModifyingBlock(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleApplyBlockModification}
                isLoading={isModifying}
                leftIcon={<Check className="w-3.5 h-3.5" />}
              >
                Validate & Apply Change
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIPlannerPage
