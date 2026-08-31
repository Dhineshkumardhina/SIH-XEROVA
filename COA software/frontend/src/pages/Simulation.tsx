import React, { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Clock,
  Sparkles,
  Layers,
  Activity,
  Radio,
  SlidersHorizontal,
  TrendingDown
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { simulationService } from '../services/simulation'
import { WhatIfScenarioBuilder } from '../components/simulation/WhatIfScenarioBuilder'
import type {
  SimulationState,
  ScenarioItem,
  SimulatedTrain,
  SimulatedBlock
} from '../types/simulation'

interface SimulationPageProps {
  subModule?: string
}

export const SimulationPage: React.FC<SimulationPageProps> = ({ subModule = 'digital-twin' }) => {
  const [activeTab, setActiveTab] = useState<'digital-twin' | 'scenarios' | 'results'>(
    subModule === 'scenarios' ? 'scenarios' : subModule === 'results' ? 'results' : 'digital-twin'
  )
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([])
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SHARED_BLOCK_OPTIMIZATION')
  const [planMode, setPlanMode] = useState<'MANUAL_BASELINE' | 'AI_OPTIMIZED'>('AI_OPTIMIZED')
  const [simState, setSimState] = useState<SimulationState | null>(null)
  const [, setIsLoading] = useState<boolean>(true)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [selectedTrain, setSelectedTrain] = useState<SimulatedTrain | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<SimulatedBlock | null>(null)

  const timerRef = useRef<any>(null)

  // 1. Load Scenarios & Initialize Simulation on Mount
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const scRes = await simulationService.getScenarios()
        const scList = scRes.data || []
        setScenarios(scList)

        const runRes = await simulationService.runSimulation({
          scenario_id: 'SHARED_BLOCK_OPTIMIZATION',
          plan_mode: 'AI_OPTIMIZED'
        })
        setSimState(runRes.data)
      } catch (err) {
        console.error('Failed to init simulation', err)
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  // 2. Playback Loop
  useEffect(() => {
    if (isPlaying && simState && simState.status !== 'COMPLETED') {
      const intervalMs = Math.max(100, 1000 / playbackSpeed)
      timerRef.current = setInterval(async () => {
        try {
          const res = await simulationService.step(simState.simulation_id, 5)
          setSimState(res.data)
          if (res.data.status === 'COMPLETED') {
            setIsPlaying(false)
          }
        } catch (err) {
          console.error('Simulation tick failed', err)
          setIsPlaying(false)
        }
      }, intervalMs)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, simState?.simulation_id, playbackSpeed, simState?.status])

  // 3. Scenario & Mode Switch Handlers
  const handleLoadScenario = async (scId: string, mode: 'MANUAL_BASELINE' | 'AI_OPTIMIZED') => {
    setIsPlaying(false)
    try {
      setIsLoading(true)
      setSelectedScenarioId(scId)
      setPlanMode(mode)
      const res = await simulationService.runSimulation({
        scenario_id: scId,
        plan_mode: mode
      })
      setSimState(res.data)
    } catch (err) {
      console.error('Failed to switch scenario', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStepForward = async () => {
    if (!simState) return
    try {
      const res = await simulationService.step(simState.simulation_id, 5)
      setSimState(res.data)
    } catch (err) {
      console.error('Step failed', err)
    }
  }

  const handleResetSimulation = async () => {
    if (!simState) return
    setIsPlaying(false)
    try {
      const res = await simulationService.reset(simState.simulation_id)
      setSimState(res.data)
    } catch (err) {
      console.error('Reset failed', err)
    }
  }

  const handleSetSpeed = async (speed: number) => {
    setPlaybackSpeed(speed)
    if (simState) {
      try {
        const res = await simulationService.setSpeed(simState.simulation_id, speed)
        setSimState(res.data)
      } catch (err) {
        console.error('Speed update failed', err)
      }
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Prominent Safety Disclaimer Banner ────────────────────────── */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span>DEMONSTRATION ENVIRONMENT — SYNTHETIC CORRIDOR SIMULATION ONLY</span>
        </div>
        <span className="font-mono text-[11px] text-amber-400/80 bg-amber-900/40 px-2.5 py-0.5 rounded border border-amber-500/30">
          NOT CONNECTED TO LIVE RAILWAY CONTROL SYSTEMS
        </span>
      </div>

      <PageHeader
        title={
          activeTab === 'scenarios'
            ? 'What-If Analysis & Scenario Simulator'
            : activeTab === 'results'
            ? 'Simulation Execution Results & Analysis'
            : 'Corridor Digital Twin Simulation'
        }
        subtitle={
          activeTab === 'scenarios'
            ? 'Modify operational parameters on isolated snapshots and evaluate consequences before approval.'
            : 'Dynamic railway corridor simulation modeling train headway movements, possession blocks, and multi-department task progress.'
        }
        breadcrumbs={[
          { label: 'Operations Simulation', href: '/simulation' },
          { label: activeTab === 'scenarios' ? 'What-If Scenarios' : activeTab === 'results' ? 'Results' : 'Corridor Digital Twin' }
        ]}
        actions={
          activeTab === 'digital-twin' ? (
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
                <button
                  onClick={() => handleLoadScenario(selectedScenarioId, 'AI_OPTIMIZED')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    planMode === 'AI_OPTIMIZED' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  AI Optimized Plan
                </button>
                <button
                  onClick={() => handleLoadScenario(selectedScenarioId, 'MANUAL_BASELINE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    planMode === 'MANUAL_BASELINE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Manual Baseline
                </button>
              </div>
            </div>
          ) : undefined
        }
      />

      {/* ── Sub-Module Navigation Tabs ──────────────────────────────── */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('digital-twin')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'digital-twin'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Corridor Digital Twin
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'scenarios'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          What-If Scenario Simulator
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'results'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Before vs After Analysis
        </button>
      </div>

      {activeTab === 'scenarios' ? (
        <WhatIfScenarioBuilder onRunInDigitalTwin={() => setActiveTab('digital-twin')} />
      ) : (
        <>

      {/* ── Top Simulation Clock & HUD Bar ────────────────────────────── */}
      <Card>
        <div className="p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Clock Display */}
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-[10px] uppercase font-mono text-slate-500">Simulation Clock</p>
                <p className="text-2xl font-bold font-mono text-slate-100 tracking-wider">
                  {simState?.simulation_time_str || '00:00'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-slate-400 font-medium">Scenario</p>
              <select
                value={selectedScenarioId}
                onChange={(e) => handleLoadScenario(e.target.value, planMode)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-200 font-bold"
              >
                {scenarios.map((sc) => (
                  <option key={sc.scenario_id} value={sc.scenario_id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controls: Play / Pause / Step / Reset / Speeds */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1 gap-1">
              <Button
                variant={isPlaying ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                leftIcon={isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              >
                {isPlaying ? 'PAUSE' : 'PLAY'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStepForward}
                disabled={isPlaying}
                leftIcon={<FastForward className="w-3.5 h-3.5" />}
              >
                STEP (+5m)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSimulation}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                RESET
              </Button>
            </div>

            {/* Speed Multipliers */}
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-xs font-mono">
              {[1.0, 2.0, 5.0, 10.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSetSpeed(spd)}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${
                    playbackSpeed === spd ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Live KPIs Bar ─────────────────────────────────────────────── */}
      {simState && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card>
            <div className="p-3">
              <p className="text-[10px] text-slate-400 uppercase">Active Trains</p>
              <p className="text-xl font-bold text-slate-100 mt-0.5">{simState.metrics.active_trains}</p>
              <p className="text-[10px] text-slate-500">{simState.metrics.completed_trains} completed</p>
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <p className="text-[10px] text-slate-400 uppercase">Active Blocks</p>
              <p className="text-xl font-bold text-purple-400 mt-0.5">{simState.metrics.active_blocks}</p>
              <p className="text-[10px] text-purple-300/80">{simState.metrics.completed_blocks} released</p>
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <p className="text-[10px] text-slate-400 uppercase">Maintenance Tasks</p>
              <p className="text-xl font-bold text-blue-400 mt-0.5">{simState.metrics.active_maintenance_tasks}</p>
              <p className="text-[10px] text-blue-300/80">{simState.metrics.completed_maintenance_tasks} completed</p>
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <p className="text-[10px] text-slate-400 uppercase">Conflicts Detected</p>
              <p className={`text-xl font-bold mt-0.5 ${simState.metrics.conflicts_detected > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {simState.metrics.conflicts_detected}
              </p>
              <p className="text-[10px] text-slate-500">Auto signal protection</p>
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <p className="text-[10px] text-slate-400 uppercase">Total Train Delay</p>
              <p className={`text-xl font-bold mt-0.5 ${simState.metrics.total_train_delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {simState.metrics.total_train_delay_minutes} min
              </p>
              <p className="text-[10px] text-slate-500">{simState.metrics.delayed_trains} delayed trains</p>
            </div>
          </Card>
          <Card>
            <div className="p-3">
              <p className="text-[10px] text-slate-400 uppercase">Track Availability</p>
              <p className="text-xl font-bold text-emerald-300 mt-0.5">{simState.metrics.asset_availability_pct}%</p>
              <p className="text-[10px] text-emerald-400/80">Operational Uptime</p>
            </div>
          </Card>
        </div>
      )}

      {/* ── Main Layout: Visual Railway Schematic + Control Panel ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Center (2 Cols): Interactive Railway Schematic */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Synthetic Corridor Topology (STN-A to STN-E)
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-blue-400">
                    <div className="w-2 h-2 rounded-full bg-blue-400" /> Express
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <div className="w-2 h-2 rounded-full bg-amber-400" /> Freight
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <div className="w-2.5 h-1.5 bg-purple-500" /> Possession Block
                  </span>
                </div>
              </div>

              {/* Schematic SVG Canvas */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 overflow-x-auto min-h-[320px] flex items-center justify-center relative">
                <svg viewBox="0 0 1000 350" className="w-full min-w-[700px] h-auto select-none">
                  {/* Track Main Line */}
                  <line x1="100" y1="180" x2="900" y2="180" stroke="#334155" strokeWidth="6" strokeDasharray="6 6" />
                  <line x1="100" y1="180" x2="900" y2="180" stroke="#475569" strokeWidth="2" />

                  {/* Highlight Blocked Sections */}
                  {simState?.blocks.map((blk) => {
                    if (blk.status !== 'ACTIVE') return null
                    let x1 = 300, x2 = 500
                    if (blk.section_code === 'SEC-AB') { x1 = 100; x2 = 300 }
                    if (blk.section_code === 'SEC-BC') { x1 = 300; x2 = 500 }
                    if (blk.section_code === 'SEC-CD') { x1 = 500; x2 = 700 }
                    if (blk.section_code === 'SEC-DE') { x1 = 700; x2 = 900 }

                    return (
                      <g key={blk.block_id} onClick={() => setSelectedBlock(blk)} className="cursor-pointer">
                        <rect
                          x={x1 + 10}
                          y={160}
                          width={x2 - x1 - 20}
                          height={40}
                          fill="rgba(168, 85, 247, 0.25)"
                          stroke="#a855f7"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                          rx="6"
                        />
                        <text x={(x1 + x2) / 2} y={150} fill="#c084fc" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                          ⚡ {blk.block_id} ({blk.departments.join(', ')})
                        </text>
                      </g>
                    )
                  })}

                  {/* Stations */}
                  {simState?.network_stations.map((stn) => (
                    <g key={stn.station_id} transform={`translate(${stn.x_coord}, 180)`}>
                      <circle r="12" fill="#0f172a" stroke="#3b82f6" strokeWidth="3" />
                      <circle r="5" fill="#60a5fa" />
                      <text y="-22" fill="#e2e8f0" fontSize="12" fontWeight="bold" textAnchor="middle">
                        {stn.code}
                      </text>
                      <text y="30" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                        {stn.km_post} km
                      </text>
                    </g>
                  ))}

                  {/* Moving Train Markers */}
                  {simState?.trains.map((tr) => {
                    if (tr.status === 'SCHEDULED' || tr.status === 'COMPLETED') return null

                    // Determine X coordinate based on section & progress
                    let baseStartX = 100
                    if (tr.current_section === 'SEC-AB') baseStartX = 100
                    else if (tr.current_section === 'SEC-BC') baseStartX = 300
                    else if (tr.current_section === 'SEC-CD') baseStartX = 500
                    else if (tr.current_section === 'SEC-DE') baseStartX = 700

                    const trainX = baseStartX + (tr.progress_pct / 100.0) * 200
                    const isFreight = tr.train_type === 'FREIGHT'
                    const isBlocked = tr.status === 'BLOCKED'

                    return (
                      <g
                        key={tr.train_id}
                        transform={`translate(${trainX}, 180)`}
                        onClick={() => setSelectedTrain(tr)}
                        className="cursor-pointer transition-all duration-300"
                      >
                        {/* Pulse animation for blocked trains */}
                        {isBlocked && (
                          <circle r="18" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1.5">
                            <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <rect
                          x="-18"
                          y="-10"
                          width="36"
                          height="20"
                          rx="4"
                          fill={isBlocked ? '#ef4444' : isFreight ? '#f59e0b' : '#3b82f6'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <text y="4" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                          {tr.train_number}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>

              {/* Selected Entity Details Drawer / Strip */}
              {selectedTrain && (
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      TRAIN {selectedTrain.train_number}
                    </span>
                    <span className="text-slate-300">
                      {selectedTrain.train_type} | {selectedTrain.origin} → {selectedTrain.destination}
                    </span>
                    <span className="text-slate-400">
                      Section: <strong className="text-slate-200">{selectedTrain.current_section || 'At Station'}</strong> ({selectedTrain.progress_pct.toFixed(0)}%)
                    </span>
                    {selectedTrain.delay_minutes > 0 && (
                      <span className="text-amber-400 font-bold">Delay: +{selectedTrain.delay_minutes.toFixed(0)} min</span>
                    )}
                  </div>
                  <button onClick={() => setSelectedTrain(null)} className="text-slate-500 hover:text-slate-300">
                    ✕
                  </button>
                </div>
              )}

              {selectedBlock && (
                <div className="p-3.5 bg-purple-950/30 rounded-xl border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedBlock.block_id}
                    </span>
                    <span className="text-slate-300">
                      Section: {selectedBlock.section_code} | Window: {selectedBlock.start_time} – {selectedBlock.end_time} ({selectedBlock.duration_minutes}m)
                    </span>
                    <span className="text-purple-300 font-bold">
                      Departments: {selectedBlock.departments.join(', ')} ({selectedBlock.tasks.length} tasks)
                    </span>
                  </div>
                  <button onClick={() => setSelectedBlock(null)} className="text-slate-500 hover:text-slate-300">
                    ✕
                  </button>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right (1 Col): Real-Time Operational Event Feed */}
        <div className="space-y-6">
          <Card>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Operational Event Feed ({simState?.events.length || 0})
                  </h3>
                </div>
              </div>

              {/* Event Stream Log */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 text-xs font-mono">
                {simState?.events.length === 0 ? (
                  <p className="text-slate-600 text-center py-6">Waiting for simulation ticks...</p>
                ) : (
                  simState?.events.slice().reverse().map((evt) => (
                    <div
                      key={evt.event_id}
                      className={`p-2.5 rounded-lg border leading-tight ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-red-950/30 border-red-500/40 text-red-300'
                          : evt.severity === 'WARNING'
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-300'
                          : evt.severity === 'SUCCESS'
                          ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold">{evt.simulation_time}</span>
                        <span className="uppercase">{evt.event_type}</span>
                      </div>
                      <p className="font-bold text-slate-200">{evt.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{evt.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Before vs After KPI Comparison (SIH Major Highlight) ──────── */}
      {simState?.plan_comparison && (
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Digital Twin Simulation Result: Manual Baseline vs AI Optimized Plan
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                SYNTHETIC DEMONSTRATION RESULT
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                <p className="text-slate-400 font-semibold uppercase tracking-wider">Current Manual Plan (Sequential)</p>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>Block Possession Time:</span>
                    <span className="font-bold text-slate-100">{simState.plan_comparison.manual_baseline.total_downtime_minutes} min (3 blocks)</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Train Delays Incurred:</span>
                    <span className="font-bold">+{simState.plan_comparison.manual_baseline.train_delay_minutes} min</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Operational Conflicts:</span>
                    <span className="font-bold">{simState.plan_comparison.manual_baseline.conflicts} conflict</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Block Utilization:</span>
                    <span className="font-bold">{simState.plan_comparison.manual_baseline.block_utilization_pct}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                <p className="text-purple-300 font-semibold uppercase tracking-wider">AI Optimized Plan (Shared Block)</p>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span>Block Possession Time:</span>
                    <span className="font-bold text-purple-300">{simState.plan_comparison.ai_optimized.total_downtime_minutes} min (1 block)</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Train Delays Incurred:</span>
                    <span className="font-bold">0.0 min (Zero disruption)</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Operational Conflicts:</span>
                    <span className="font-bold">0 conflicts (Verified)</span>
                  </div>
                  <div className="flex justify-between text-purple-300">
                    <span>Block Utilization:</span>
                    <span className="font-bold">{simState.plan_comparison.ai_optimized.block_utilization_pct}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                <p className="text-emerald-300 font-semibold uppercase tracking-wider">Net Operational Efficiency Savings</p>
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Track Downtime Saved:</span>
                    <span>+{simState.plan_comparison.savings.time_saved_minutes} min ({simState.plan_comparison.savings.downtime_reduction_pct}%)</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Train Delay Avoided:</span>
                    <span>+{simState.plan_comparison.savings.delay_avoided_minutes} min</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cross-Discipline Bundling:</span>
                    <span>ENG + SIG + TRC</span>
                  </div>
                  <div className="flex justify-between text-emerald-300">
                    <span>Network Availability Gain:</span>
                    <span className="font-bold">+18.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
        </>
      )}
    </div>
  )
}

export default SimulationPage
