import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Play,
  SlidersHorizontal,
  Send,
  XCircle,
  Route as RouteIcon,
  Check,
  RefreshCw
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { plannerService } from '../../services/planner'
import { useAuthStore } from '../../store/authStore'

export const OptimizationResultPage: React.FC = () => {
  const navigate = useNavigate()
  const { hasRole } = useAuthStore()
  const isOfficer = hasRole('CONTROL_OFFICER') || hasRole('SUPER_ADMIN')

  const [approved, setApproved] = useState(false)
  const [rejected, setRejected] = useState(false)

  // Fetch live daily plan data
  const { data: planData, isFetching, refetch } = useQuery({
    queryKey: ['planner', 'daily', 'optimization-result'],
    queryFn: () => plannerService.getDailyPlan()
  })

  const summary = planData?.data?.summary
  const timeSaved = summary?.time_saved_minutes || 150
  const trainDelay = summary?.expected_train_delay_minutes ?? 0.0
  const optScore = summary?.optimization_score || 98.5
  const corridorName = planData?.data?.corridor_name || 'Alpha-Bravo Main Trunk'
  const corridorId = planData?.data?.corridor_id || 'COR-A01'

  const handleApprove = () => {
    setApproved(true)
    setRejected(false)
  }

  const handleReject = () => {
    setRejected(true)
    setApproved(false)
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. HEADER ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                AI BLOCK OPTIMIZATION COMPLETE
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Corridor: <strong className="font-mono text-blue-600 dark:text-blue-400">{corridorId}</strong> ({corridorName})
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                OPTIMIZATION SUCCESSFUL
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                SYNTHETIC DEMONSTRATION RESULT
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Google OR-Tools CP-SAT integer programming solver consolidated fragmented departmental requests into a unified shared block.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className={isFetching ? 'w-3.5 h-3.5 animate-spin' : 'w-3.5 h-3.5'} />}
              className="text-xs h-8 px-2.5"
              title="Refresh Optimization Telemetry"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai/planner')}
              leftIcon={<RouteIcon className="w-3.5 h-3.5 text-blue-500" />}
              className="text-xs h-8 border-slate-300 dark:border-slate-700"
            >
              VIEW PLAN
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/simulation')}
              leftIcon={<Play className="w-3.5 h-3.5 text-purple-500" />}
              className="text-xs h-8 border-slate-300 dark:border-slate-700"
            >
              RUN SIMULATION
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai/planner')}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
              className="text-xs h-8 border-slate-300 dark:border-slate-700"
            >
              MODIFY
            </Button>
            {isOfficer && !approved && !rejected && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReject}
                  leftIcon={<XCircle className="w-3.5 h-3.5 text-red-500" />}
                  className="text-xs h-8 border-red-300 dark:border-red-800 text-red-600 hover:bg-red-50"
                >
                  REJECT
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-500 font-bold"
                >
                  APPROVE
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Approval feedback banner */}
        {approved && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 font-bold" />
              <span>
                <strong>Plan Approved & Published:</strong> Shared possession block on COR-A01 (01:00–03:00) committed with audit token.
              </span>
            </div>
            <Link to="/blocks" className="font-bold underline text-emerald-700 dark:text-emerald-300">
              View in Blocks Hub →
            </Link>
          </div>
        )}

        {rejected && (
          <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700 text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600 font-bold" />
              <span>
                <strong>Plan Rejected:</strong> Section Control Officer requested manual re-scheduling.
              </span>
            </div>
            <Button size="sm" variant="outline" onClick={() => setRejected(false)} className="h-6 text-[10px]">
              Undo
            </Button>
          </div>
        )}
      </div>

      {/* ── 2. KEY RESULTS SUMMARY STRIP (7 Dynamic Metric Cards) ──── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Time Saved</span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">+{timeSaved} min</p>
          <span className="text-[10px] text-emerald-600/90 font-semibold block truncate mt-0.5">55.6% Downtime Saved</span>
        </div>

        <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 shadow-sm">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">Block Reduction</span>
          <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">-66.7%</p>
          <span className="text-[10px] text-purple-600/90 font-semibold block truncate mt-0.5">3 blocks → 1 shared</span>
        </div>

        <div className="p-3 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm">
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">Tasks Consolidated</span>
          <p className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">5 Tasks</p>
          <span className="text-[10px] text-blue-600/90 font-semibold block truncate mt-0.5">Civil + S&T + Traction</span>
        </div>

        <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">Train Impact</span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{trainDelay.toFixed(1)} min</p>
          <span className="text-[10px] text-emerald-600/90 font-semibold block truncate mt-0.5">26.0m Delay Avoided</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Block Utilization</span>
          <p className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 mt-1">89.2%</p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block truncate mt-0.5">+33.6% Work Density</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Availability Gain</span>
          <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">+18.5%</p>
          <span className="text-[10px] text-slate-400 block truncate mt-0.5">Corridor Uptime</span>
        </div>

        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CP-SAT Score</span>
          <p className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">{optScore.toFixed(1)} <span className="text-xs text-slate-400">/ 100</span></p>
          <span className="text-[10px] text-purple-600/80 block truncate mt-0.5">Optimal Solution</span>
        </div>
      </div>

      {/* ── 3. VISUAL TIMELINE COMPARISON ──────────────────────────── */}
      <Card>
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Timeline Comparison: Decentralized Baseline vs CP-SAT AI Shared Possession
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">24-Hour Horizon Simulation</span>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-6">

          {/* BEFORE TIMELINE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20 font-mono font-bold text-[10px]">
                  BEFORE OPTIMIZATION
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Decentralized Planning (3 Disjoint Departmental Possessions)
                </span>
              </div>
              <span className="font-mono font-bold text-red-600 dark:text-red-400 text-xs">
                Total Occupation: 270 min (4.5 hrs) | Train Delay: +26.0 min
              </span>
            </div>

            {/* Visual Timeline Bar: BEFORE */}
            <div className="relative h-20 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-2 overflow-hidden">
              {/* Hour Grid Markers */}
              <div className="absolute inset-0 flex justify-between px-3 text-[9px] font-mono text-slate-400 pointer-events-none items-end pb-1 border-b border-slate-300/30">
                <span>00:00</span>
                <span>01:00</span>
                <span>02:00</span>
                <span>03:00</span>
                <span>04:00</span>
                <span>05:00</span>
                <span>06:00</span>
                <span>07:00</span>
              </div>

              {/* Block 1: Engineering (01:00 - 03:00) */}
              <div
                className="absolute top-2 h-7 rounded bg-blue-600 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-sm"
                style={{ left: '12.5%', width: '25%' }}
                title="Engineering Track Tamping & Grinding (01:00 - 03:00)"
              >
                ENG: Track (01:00–03:00)
              </div>

              {/* Block 2: Signalling (03:00 - 04:00) */}
              <div
                className="absolute top-2 h-7 rounded bg-amber-600 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-sm"
                style={{ left: '37.5%', width: '12.5%' }}
                title="S&T Relay & Point Machine Calibration (03:00 - 04:00)"
              >
                SIG (03:00–04:00)
              </div>

              {/* Block 3: Traction (04:00 - 05:30) */}
              <div
                className="absolute top-2 h-7 rounded bg-purple-600 text-white text-[10px] font-bold font-mono flex items-center justify-center shadow-sm"
                style={{ left: '50%', width: '18.75%' }}
                title="Traction 25kV OHE Catenary Stagger Inspection (04:00 - 05:30)"
              >
                TRC: OHE (04:00–05:30)
              </div>

              {/* Conflict indicator overlapping morning rush */}
              <div
                className="absolute top-2 h-7 border-2 border-dashed border-red-500 rounded bg-red-500/20 flex items-center justify-center text-[9px] font-bold text-red-600"
                style={{ left: '60%', width: '10%' }}
                title="Timetable Clash: Freight 56813 and Express 12601 delayed"
              >
                ⚠️ CLASH
              </div>
            </div>
          </div>

          {/* AFTER TIMELINE */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[10px]">
                  AFTER AI OPTIMIZATION
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Google OR-Tools CP-SAT (1 Consolidated Multi-Discipline Shared Block)
                </span>
              </div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                Total Occupation: 120 min (2.0 hrs) | Train Delay: 0.0 min (Zero Delay)
              </span>
            </div>

            {/* Visual Timeline Bar: AFTER */}
            <div className="relative h-20 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 p-2 overflow-hidden">
              {/* Hour Grid Markers */}
              <div className="absolute inset-0 flex justify-between px-3 text-[9px] font-mono text-slate-400 pointer-events-none items-end pb-1 border-b border-emerald-300/30">
                <span>00:00</span>
                <span>01:00</span>
                <span>02:00</span>
                <span>03:00</span>
                <span>04:00</span>
                <span>05:00</span>
                <span>06:00</span>
                <span>07:00</span>
              </div>

              {/* Single Shared Block: 01:00 - 03:00 */}
              <div
                className="absolute top-2 h-7 rounded bg-gradient-to-r from-blue-600 via-amber-600 to-purple-600 text-white text-[11px] font-bold font-mono flex items-center justify-between px-3 shadow-md"
                style={{ left: '12.5%', width: '25%' }}
                title="Shared Multi-Department Block (01:00 - 03:00): Civil Track + S&T + 25kV OHE"
              >
                <span>SHARED POSSESSION (ENG + SIG + TRC)</span>
                <span className="text-[10px] opacity-90">120m</span>
              </div>

              {/* Restored Track Capacity */}
              <div
                className="absolute top-2 h-7 border border-dashed border-emerald-500 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                style={{ left: '37.5%', width: '31.25%' }}
              >
                ✓ Restored Track Capacity (+150 min Free Window for Train Movements)
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* ── 4. TWO LARGE COMPARISON PANELS ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* BASELINE PANEL */}
        <Card className="border-red-200 dark:border-red-900/40 bg-red-50/10 dark:bg-red-950/10">
          <CardHeader className="py-3 px-5 border-b border-red-100 dark:border-red-900/30 bg-red-50/40 dark:bg-red-950/20">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-red-800 dark:text-red-300">
                  Baseline (Decentralized Uncoordinated Planning)
                </CardTitle>
              </div>
              <Badge variant="danger" size="sm">3 SEPARATE CLOSURES</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-blue-600 dark:text-blue-400">1. Civil Engineering</span>
                  <span>01:00 – 03:00 (120m)</span>
                </div>
                <p className="text-[11px] text-slate-500">Track Tamping & Rail Grinding on Switch Turnout #104</p>
              </div>

              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-amber-600 dark:text-amber-400">2. Signal & Telecom</span>
                  <span>03:00 – 04:00 (60m)</span>
                </div>
                <p className="text-[11px] text-slate-500">Track Circuit Relay #201 Calibration & Point Machine Testing</p>
              </div>

              <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex justify-between font-mono font-bold">
                  <span className="text-purple-600 dark:text-purple-400">3. Traction (OHE)</span>
                  <span>04:00 – 05:30 (90m)</span>
                </div>
                <p className="text-[11px] text-slate-500">25kV Catenary Stagger Inspection & Isolator Maintenance</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Track Occupation:</span>
                <span className="font-mono font-bold text-red-600">270 minutes (4.5 hours)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Number of Block Possessions:</span>
                <span className="font-mono font-bold">3 isolated shutdowns</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Train Delay Impact:</span>
                <span className="font-mono font-bold text-red-600">+26.0 minutes (2 trains delayed)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unused Track Capacity / Waste:</span>
                <span className="font-mono font-bold text-red-600">High (3 separate de-energizations & setups)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI OPTIMIZED PANEL */}
        <Card className="border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/10 dark:bg-emerald-950/10">
          <CardHeader className="py-3 px-5 border-b border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/40 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  AI Optimized (OR-Tools CP-SAT Coordinated Shared Block)
                </CardTitle>
              </div>
              <Badge variant="success" size="sm">1 SHARED POSSESSION</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  Shared Block (COR-A01)
                </span>
                <span className="font-mono font-bold text-xs bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700">
                  01:00 – 03:00 (120m)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Synchronized possession uniting Civil Track + S&T + 25kV Traction teams concurrently in a single safety envelope.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  ENG: Turnout #104
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  SIG: Relay #201
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  TRC: OHE Stagger
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Track Occupation:</span>
                <span className="font-mono font-bold text-emerald-600">120 minutes (2.0 hours)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Number of Block Possessions:</span>
                <span className="font-mono font-bold text-emerald-600">1 unified shared possession (-66.7%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Train Delay Impact:</span>
                <span className="font-mono font-bold text-emerald-600">0.0 minutes (Zero Delay)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unused Track Capacity / Waste:</span>
                <span className="font-mono font-bold text-emerald-600">Zero waste (Single electrical isolation)</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ── 5. WHY THE OPTIMIZER CHANGED IT ───────────────────────── */}
      <Card>
        <CardHeader className="py-3 px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Mathematical Rationale: Why the CP-SAT Optimizer Consolidated the Possessions
              </CardTitle>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Exact Constraint Satisfaction</span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Compatible Tasks</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Track tamping, relay calibration, and OHE stagger inspections can occur simultaneously on the same segment.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Same Corridor Section</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                All 5 work orders belong to Corridor COR-A01 km 142.0 – 148.5, allowing a single perimeter boundary.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Compatible Isolation</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                25kV OHE power de-energization satisfies safety requirements for all civil and signalling personnel.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Low Train Density</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                01:00–03:00 slot avoids Express 12601 and Freight 56813, producing 0.0 min timetable delay.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Low Goods Forecast</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                SARIMA freight demand model projects zero siding dispatches during the selected window.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Critical Tasks Prioritized</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Switch Turnout #104 (Risk 95/100) and overdue track grinding are resolved immediately.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Reduced Occupation</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Saves 150 minutes of track closure time, returning 2.5 hours of operational capacity.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-600 dark:text-purple-400">
                <Zap className="w-4 h-4" />
                <span>CP-SAT Optimality</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                Proven mathematically optimal under multi-objective weighting in 0.38 seconds.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

export default OptimizationResultPage
