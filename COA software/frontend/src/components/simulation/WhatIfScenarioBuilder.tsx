import React, { useState, useEffect } from 'react'
import {
  SlidersHorizontal,
  Play,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  ArrowRight,
  Layers,
  Zap,
  Activity
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { whatIfService } from '../../services/whatIf'
import type {
  SimulationScenarioItem,
  ScenarioResult,
  ScenarioParameters
} from '../../types/whatIf'

interface WhatIfScenarioBuilderProps {
  onRunInDigitalTwin?: (scenarioId: string) => void
}

export const WhatIfScenarioBuilder: React.FC<WhatIfScenarioBuilderProps> = ({
  onRunInDigitalTwin
}) => {
  const [scenarios, setScenarios] = useState<SimulationScenarioItem[]>([])
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenarioItem | null>(null)
  const [, setIsLoading] = useState<boolean>(true)
  const [isExecuting, setIsExecuting] = useState<boolean>(false)
  const [validationResult, setValidationResult] = useState<{ is_valid: boolean; conflicts: string[] } | null>(null)
  const [result, setResult] = useState<ScenarioResult | null>(null)

  // Local editable parameters state
  const [blockStart, setBlockStart] = useState<string>('01:00')
  const [blockDuration, setBlockDuration] = useState<number>(120)
  const [trafficMultiplier, setTrafficMultiplier] = useState<number>(1.0)
  const [goodsForecast, setGoodsForecast] = useState<number>(4.5)
  const [selectedTasks, setSelectedTasks] = useState<string[]>(['MT-001', 'MT-002', 'MT-003'])

  // 1. Fetch Scenarios on Mount
  const fetchScenarios = async () => {
    try {
      setIsLoading(true)
      const res = await whatIfService.getScenarios()
      const list = res.data || []
      setScenarios(list)
      if (list.length > 0 && !selectedScenario) {
        selectScenarioItem(list[0])
      }
    } catch (err) {
      console.error('Failed to load What-If scenarios', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchScenarios()
  }, [])

  const selectScenarioItem = (sc: SimulationScenarioItem) => {
    setSelectedScenario(sc)
    const params = sc.configuration?.parameters
    if (params) {
      setBlockStart(params.block_start || '01:00')
      setBlockDuration(params.block_duration_minutes || 120)
      setTrafficMultiplier(params.passenger_traffic_multiplier || 1.0)
      setGoodsForecast(params.goods_forecast_rate || 4.5)
      setSelectedTasks(params.selected_tasks || ['MT-001', 'MT-002', 'MT-003'])
    }
    setResult(sc.configuration?.results || null)
    setValidationResult(null)
  }

  // 2. Quick Templates
  const handleApplyTemplate = async (templateName: string) => {
    let name = ''
    let desc = ''
    let params: Partial<ScenarioParameters> = {}

    if (templateName === 'MOVE_BLOCK_PEAK') {
      name = 'What-If: Shift Block to Peak (18:00)'
      desc = 'Evaluate consequences of moving night possession to evening peak express window.'
      params = { block_start: '18:00', block_duration_minutes: 120, passenger_traffic_multiplier: 1.5 }
    } else if (templateName === 'HIGH_GOODS') {
      name = 'What-If: Surge in Goods Freight (8.0 tr/h)'
      desc = 'Stress test corridor line capacity with heavy freight train traffic.'
      params = { block_start: '01:00', block_duration_minutes: 120, goods_forecast_rate: 8.0, passenger_traffic_multiplier: 1.2 }
    } else if (templateName === 'EXTENDED_MAINT') {
      name = 'What-If: Extended Rail Grinding (180m)'
      desc = 'Test overrun buffer when deep track maintenance requires 3 full possession hours.'
      params = { block_start: '01:00', block_duration_minutes: 180 }
    } else if (templateName === 'NIGHT_OPTIMAL') {
      name = 'What-If: Coordinated Night Window (01:00)'
      desc = 'Ideal low-disruption multi-department possession window.'
      params = { block_start: '01:00', block_duration_minutes: 120, passenger_traffic_multiplier: 1.0, goods_forecast_rate: 4.5 }
    }

    try {
      const res = await whatIfService.createScenario({
        name,
        description: desc,
        parameters: params
      })
      if (res.data) {
        await fetchScenarios()
        selectScenarioItem(res.data)
        // Auto-run newly created template
        handleRunAnalysis(res.data.id)
      }
    } catch (err) {
      console.error('Failed to create scenario from template', err)
    }
  }

  // 3. Update & Validate Parameters
  const handleValidate = async () => {
    if (!selectedScenario) return
    try {
      // Save parameters first
      await whatIfService.updateScenario(selectedScenario.id, {
        parameters: {
          block_start: blockStart,
          block_duration_minutes: blockDuration,
          passenger_traffic_multiplier: trafficMultiplier,
          goods_forecast_rate: goodsForecast,
          selected_tasks: selectedTasks
        }
      })
      const valRes = await whatIfService.validateScenario(selectedScenario.id)
      setValidationResult(valRes.data)
    } catch (err) {
      console.error('Validation failed', err)
    }
  }

  // 4. Run Analysis
  const handleRunAnalysis = async (scenarioIdOverride?: string) => {
    const scId = scenarioIdOverride || selectedScenario?.id
    if (!scId) return
    try {
      setIsExecuting(true)
      // Save updated parameters
      await whatIfService.updateScenario(scId, {
        parameters: {
          block_start: blockStart,
          block_duration_minutes: blockDuration,
          passenger_traffic_multiplier: trafficMultiplier,
          goods_forecast_rate: goodsForecast,
          selected_tasks: selectedTasks
        }
      })
      const runRes = await whatIfService.runScenario(scId)
      setResult(runRes.data)
      fetchScenarios()
    } catch (err) {
      console.error('Scenario execution failed', err)
    } finally {
      setIsExecuting(false)
    }
  }

  // 5. Duplicate
  const handleDuplicate = async () => {
    if (!selectedScenario) return
    try {
      const res = await whatIfService.duplicateScenario(selectedScenario.id)
      await fetchScenarios()
      if (res.data) selectScenarioItem(res.data)
    } catch (err) {
      console.error('Duplicate failed', err)
    }
  }

  // Calculate block end time display
  const calculateBlockEnd = (start: string, durationMin: number) => {
    const [h, m] = start.split(':').map(Number)
    const totalMin = h * 60 + m + durationMin
    const endH = Math.floor(totalMin / 60) % 24
    const endM = totalMin % 60
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* ── Quick Templates Bar ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Quick What-If Templates
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">1-Click Scenario Generators</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleApplyTemplate('MOVE_BLOCK_PEAK')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-200 group-hover:text-blue-400 flex items-center justify-between">
              Shift to Peak Hours
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Move window to 18:00-20:00 (High delay impact)</p>
          </button>

          <button
            onClick={() => handleApplyTemplate('HIGH_GOODS')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-200 group-hover:text-amber-400 flex items-center justify-between">
              Surge in Freight
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Increase goods forecast to 8.0 trains/hour</p>
          </button>

          <button
            onClick={() => handleApplyTemplate('EXTENDED_MAINT')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-200 group-hover:text-purple-400 flex items-center justify-between">
              Extended Possession
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-purple-400" />
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Increase block duration to 180 min</p>
          </button>

          <button
            onClick={() => handleApplyTemplate('NIGHT_OPTIMAL')}
            className="p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/80 rounded-xl text-left transition-all group"
          >
            <p className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 flex items-center justify-between">
              Optimal Night Window
              <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
            </p>
            <p className="text-[11px] text-slate-400 mt-1">01:00-03:00 low traffic shared window</p>
          </button>
        </div>
      </div>

      {/* ── Main Layout: Scenario Selector & Parameters + Comparison Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 Col): Scenario List & Parameters Editor */}
        <div className="space-y-6">
          {/* Scenario Selector Card */}
          <Card>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Scenarios ({scenarios.length})
                  </h4>
                </div>
                <Button size="sm" variant="outline" onClick={handleDuplicate} leftIcon={<Copy className="w-3 h-3" />}>
                  Clone
                </Button>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => selectScenarioItem(sc)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                      selectedScenario?.id === sc.id
                        ? 'bg-blue-950/40 border-blue-500/50 text-blue-200 font-bold'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="truncate">{sc.name}</p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Start: {sc.configuration?.parameters.block_start || '01:00'} ({sc.configuration?.parameters.block_duration_minutes || 120}m)
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Parameter Modification Controls */}
          <Card>
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Modify Parameters
                  </h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30">
                  ISOLATED SNAPSHOT
                </span>
              </div>

              {/* Block Start & End Time */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Block Start Time</label>
                  <input
                    type="time"
                    value={blockStart}
                    onChange={(e) => setBlockStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Calculated End Time</label>
                  <input
                    type="text"
                    disabled
                    value={calculateBlockEnd(blockStart, blockDuration)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-400 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Block Duration Selector */}
              <div>
                <label className="text-slate-400 font-medium text-xs block mb-1">
                  Block Duration: <strong className="text-slate-200 font-mono">{blockDuration} min</strong>
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono">
                  {[60, 90, 120, 180].map((dur) => (
                    <button
                      key={dur}
                      onClick={() => setBlockDuration(dur)}
                      className={`py-1.5 rounded-md border text-center transition-all ${
                        blockDuration === dur
                          ? 'bg-purple-600 text-white border-purple-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {dur}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Traffic Density Sliders */}
              <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Passenger Traffic Density</span>
                    <span className="font-mono text-slate-200 font-bold">{trafficMultiplier}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={trafficMultiplier}
                    onChange={(e) => setTrafficMultiplier(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Goods Train Forecast Rate</span>
                    <span className="font-mono text-slate-200 font-bold">{goodsForecast} trains/h</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="10.0"
                    step="0.5"
                    value={goodsForecast}
                    onChange={(e) => setGoodsForecast(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>
              </div>

              {/* Action Buttons: Validate & Run Analysis */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleValidate} className="flex-1">
                  Validate
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRunAnalysis()}
                  disabled={isExecuting}
                  className="flex-1"
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  {isExecuting ? 'Evaluating...' : 'Run Analysis'}
                </Button>
              </div>

              {/* Validation Feedback */}
              {validationResult && (
                <div
                  className={`p-3 rounded-lg border text-xs ${
                    validationResult.is_valid
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/30 border-red-500/40 text-red-300'
                  }`}
                >
                  {validationResult.is_valid ? (
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Valid Scenario Configuration</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span>Safety Constraint Conflicts Detected:</span>
                      </div>
                      <ul className="list-disc pl-5 text-[11px] text-red-300/80">
                        {validationResult.conflicts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column (2 Cols): Results, KPI Comparison & Explainability */}
        <div className="lg:col-span-2 space-y-6">
          {result ? (
            <>
              {/* ── KPI Delta Comparison Dashboard ────────────────────────── */}
              <Card>
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Scenario Impact vs Baseline Plan
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Evaluated on Corridor COR-A01 ({blockStart} – {calculateBlockEnd(blockStart, blockDuration)})
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Score: <strong>{result.score}/100</strong>
                    </span>
                  </div>

                  {/* Deltas Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Train Delay */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 uppercase text-[10px]">Train Delay</p>
                      <p className="text-lg font-bold text-slate-100">{result.scenario_metrics.train_delay_minutes} min</p>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className={result.deltas.train_delay_minutes?.status === 'IMPROVED' ? 'text-emerald-400' : result.deltas.train_delay_minutes?.diff > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {result.deltas.train_delay_minutes?.diff > 0 ? `+${result.deltas.train_delay_minutes.diff}m` : '0m'}
                        </span>
                        <span className="text-slate-500">vs base</span>
                      </div>
                    </div>

                    {/* Operational Conflicts */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 uppercase text-[10px]">Conflicts</p>
                      <p className={`text-lg font-bold ${result.scenario_metrics.conflicts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {result.scenario_metrics.conflicts}
                      </p>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className={result.scenario_metrics.conflicts > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                          {result.scenario_metrics.conflicts > 0 ? `+${result.scenario_metrics.conflicts} conflict` : 'Clean'}
                        </span>
                      </div>
                    </div>

                    {/* Asset Availability */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 uppercase text-[10px]">Availability</p>
                      <p className="text-lg font-bold text-emerald-300">{result.scenario_metrics.asset_availability_pct}%</p>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className={result.deltas.asset_availability_pct?.diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {result.deltas.asset_availability_pct?.diff > 0 ? `+${result.deltas.asset_availability_pct.diff}%` : `${result.deltas.asset_availability_pct?.diff}%`}
                        </span>
                      </div>
                    </div>

                    {/* Block Utilization */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1">
                      <p className="text-slate-400 uppercase text-[10px]">Utilization</p>
                      <p className="text-lg font-bold text-purple-300">{result.scenario_metrics.block_utilization_pct}%</p>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span className="text-purple-400 font-bold">
                          {result.scenario_metrics.total_tasks_completed} tasks bundled
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* ── AI Explainability Box & Alternative Recommendation ───────── */}
              <Card>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      AI Root-Cause Explainability
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">What Changed?</p>
                      <p className="text-slate-200 mt-0.5">{result.explanation.what_changed}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Operational Impact</p>
                      <p className="text-slate-200 mt-0.5">{result.explanation.what_happened}</p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-semibold uppercase text-[10px]">Root Cause Analysis</p>
                      <ul className="list-disc pl-5 text-slate-300 space-y-1 mt-1">
                        {result.explanation.why.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-blue-950/30 rounded-lg border border-blue-500/30">
                      <p className="text-blue-300 font-bold uppercase text-[10px]">Recommendation</p>
                      <p className="text-slate-200 mt-0.5">{result.explanation.recommendation}</p>
                    </div>
                  </div>

                  {/* Alternative Recommendation if Suboptimal */}
                  {result.alternative_recommendation && (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-emerald-300">
                          <Lightbulb className="w-4 h-4 text-emerald-400" />
                          <span>BETTER ALTERNATIVE WINDOW DETECTED</span>
                        </div>
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-200 border border-emerald-500/30">
                          {result.alternative_recommendation.window}
                        </span>
                      </div>
                      <p className="text-slate-300">{result.alternative_recommendation.rationale}</p>
                      <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-emerald-400">
                        <span>Delay Avoidance: +{result.alternative_recommendation.savings_vs_scenario.delay_reduced_minutes} min</span>
                        <span>Optimization Score: +{result.alternative_recommendation.savings_vs_scenario.score_improvement} pts</span>
                      </div>
                    </div>
                  )}

                  {/* Bridge: Run in Digital Twin Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onRunInDigitalTwin?.(selectedScenario?.id || 'SHARED_BLOCK_OPTIMIZATION')}
                      leftIcon={<Activity className="w-3.5 h-3.5 text-blue-400" />}
                    >
                      Run Scenario in Digital Twin Simulation →
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="p-12 text-center text-slate-500 space-y-3">
                <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs">Adjust parameters on the left and click <strong>Run Analysis</strong> to evaluate consequences.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
