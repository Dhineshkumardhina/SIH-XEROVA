import React, { useState } from 'react'
import {
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowDown,
  Server,
  Train,
  AlertTriangle,
  SlidersHorizontal,
  Bot,
  Route as RouteIcon,
  Zap,
  Sparkles,
  Code
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { cn } from '../shared/utils'

interface ArchComponent {
  id: string
  name: string
  layer: string
  status: 'IMPLEMENTED' | 'IMPLEMENTED — SIMULATED DATA' | 'FUTURE RAILWAY INTEGRATION'
  purpose: string
  inputs: string[]
  outputs: string[]
  technology: string
  details: string
  icon: React.ComponentType<{ className?: string }>
}

const ARCH_COMPONENTS: ArchComponent[] = [
  // ── LAYER 1: EXTERNAL DATA SOURCES
  {
    id: 'tms',
    name: 'TMS (Track Management System)',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Provides track geometry measurements, ultrasonic flaw records, switch turnout health, and rail wear degradation.',
    inputs: ['Track inspection car runs', 'USFD ultrasonic flaw reports', 'Track maintenance logs'],
    outputs: ['TrackAsset records', 'Defect entries (CRITICAL/HIGH)', 'Degradation curve metrics'],
    technology: 'FastAPI Integration Adapter, PostGIS GeoJSON parsing, synthetic CRIS TMS schema',
    details: 'In production, connects to CRIS TMS through secure REST/SFTP endpoints. Currently operates with verified synthetic Indian Railways track asset datasets.',
    icon: RouteIcon
  },
  {
    id: 'smms',
    name: 'SMMS (Signalling Maintenance Management)',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Supplies real-time point machine stroke counts, track circuit relay voltages, and signal aspect status.',
    inputs: ['Point machine telemetry', 'Relay room data loggers', 'Interlocking status frames'],
    outputs: ['SignalAsset records', 'Overdue relay calibration alerts', 'Failure risk factors'],
    technology: 'SMMS JSON Ingestion Adapter, relational mapping, priority queue',
    details: 'Ingests signalling point machine degradation logs to detect incipient switch motor failures and relay ground faults.',
    icon: Zap
  },
  {
    id: 'tdms',
    name: 'TDMS (Traction Distribution Management)',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Monitors 25kV OHE catenary wire stagger, contact wire thickness, and traction substation isolation boundaries.',
    inputs: ['OHE inspection cars', 'Traction SCADA feeds', 'Substation power logs'],
    outputs: ['TractionAsset records', 'Power block isolation constraints', 'OHE stagger tasks'],
    technology: 'TDMS Adapter, Electrical Isolation Constraint Engine',
    details: 'Defines 25kV power shutoff requirements. Enforces safety interlocking between electrical shutoff and adjacent track occupations.',
    icon: Zap
  },
  {
    id: 'bdms',
    name: 'BDMS (Bridge Data Management System)',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Tracks bridge girder inspections, culvert structural health, and underwater pier sonar telemetry.',
    inputs: ['Bridge annual inspection reports', 'Deflection sensors', 'Scour depth gauges'],
    outputs: ['BridgeAsset records', 'Speed restriction recommendations', 'Structural tasks'],
    technology: 'BDMS Parser, structural stress threshold rules',
    details: 'Provides structural safety constraints on major bridges and viaducts along trunk corridors.',
    icon: Server
  },
  {
    id: 'coa',
    name: 'COA (Control Office Application)',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Feeds real-time train positions, section controller train graphs, and statutory block clearing records.',
    inputs: ['Section train charting', 'GPS locomotive tracking', 'Block clearing timestamps'],
    outputs: ['Live train positions', 'Section headway occupancy', 'Train delay variance'],
    technology: 'COA Feed Adapter, Event-driven Webhooks',
    details: 'Simulates section controller train charting feeds to validate available time gaps between running trains.',
    icon: Activity
  },
  {
    id: 'timetable',
    name: 'Passenger Express Timetables',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Maintains master scheduled paths for Express, Superfast, and Passenger commuter train movements.',
    inputs: ['National Train Enquiry System (NTES) schedules', 'Zone working timetables'],
    outputs: ['TrainSchedule database records', 'Path conflict vectors', 'Headway buffers'],
    technology: 'PostgreSQL Relational Schema, Time-window indexing',
    details: 'Contains complete timetable curves for corridors like COR-A01, ensuring zero passenger train clashes during possession planning.',
    icon: Train
  },
  {
    id: 'goods_forecast',
    name: 'Freight Flow & Goods Forecast',
    layer: '1. External Railway Feeds',
    status: 'IMPLEMENTED — SIMULATED DATA',
    purpose: 'Forecasts freight rake demand, coal/ore loading dispatches, and siding departure windows.',
    inputs: ['Freight Operations Information System (FOIS) data', 'Siding loading schedules'],
    outputs: ['GoodsForecast records', 'Daily freight traffic density by hour'],
    technology: 'SARIMA Time-Series Forecasting Model, FOIS Parser',
    details: 'Predicts freight movement volumes to prevent blocking crucial commodity corridors during peak freight hours.',
    icon: Train
  },

  // ── LAYER 2: INTEGRATION & INGESTION
  {
    id: 'integration_layer',
    name: 'Integration & Normalization Layer',
    layer: '2. Ingestion & Standardization',
    status: 'IMPLEMENTED',
    purpose: 'Validates, normalizes, deduplicates, and ingests multi-source data into the unified railway data model.',
    inputs: ['Raw payloads from TMS, SMMS, TDMS, BDMS, COA, Timetables, Goods'],
    outputs: ['Validated, type-safe Domain Entities in Postgres'],
    technology: 'FastAPI Service Layer, Pydantic V2 schemas, Sync Orchestrator, Redis Caching',
    details: 'Ensures 100% idempotent data ingestion. Validates schema contracts and maps diverse external representations to standard CRDM format.',
    icon: SlidersHorizontal
  },

  // ── LAYER 3: UNIFIED RAILWAY DATA MODEL (CRDM)
  {
    id: 'crdm',
    name: 'Unified Railway Data Model (URDM / CRDM)',
    layer: '3. Core Data Foundation',
    status: 'IMPLEMENTED',
    purpose: 'Provides a single source of truth connecting infrastructure geometry, assets, maintenance tasks, and timetables.',
    inputs: ['Normalized entities from Integration Layer'],
    outputs: ['Relational persistence for Corridors, Assets, Tasks, Blocks, Timetables, Audit Logs'],
    technology: 'PostgreSQL 16, PostGIS Geospatial Extensions, SQLAlchemy 2.0 ORM, Alembic Migrations',
    details: '50 relational tables with strict foreign key referential integrity, geospatial indexing for track segments, and immutable audit logs.',
    icon: Database
  },

  // ── LAYER 4: AI INTELLIGENCE & MODELING
  {
    id: 'ai_priority',
    name: 'AI Maintenance Priority Engine',
    layer: '4. AI Intelligence & Risk',
    status: 'IMPLEMENTED',
    purpose: 'Calculates dynamic urgency scores (0–100) for all open maintenance work orders.',
    inputs: ['Maintenance task attributes', 'Asset health scores', 'Overdue days', 'Track speed index'],
    outputs: ['AIPriorityScore', 'Multi-factor explainability weights'],
    technology: 'Multi-criteria scoring model, exponential decay penalty, Scikit-Learn',
    details: 'Evaluates safety risk, track speed classification, and overdue penalties to prioritize high-risk turnout and signal repairs.',
    icon: Bot
  },
  {
    id: 'ai_risk',
    name: 'Asset Failure Risk & Degradation Engine',
    layer: '4. AI Intelligence & Risk',
    status: 'IMPLEMENTED',
    purpose: 'Predicts asset failure probability and remaining useful life before critical breakdown.',
    inputs: ['Asset age', 'Cumulative GMT tonnage', 'Operating cycles', 'Defect history'],
    outputs: ['AssetRiskPrediction', 'Failure probability (0.0–1.0)', 'Risk Level (CRITICAL/HIGH/MED/LOW)'],
    technology: 'Weibull & Exponential asset degradation models, failure hazard curves',
    details: 'Identifies high-risk switch turnouts and relay coils approaching failure, driving preventative block scheduling.',
    icon: AlertTriangle
  },
  {
    id: 'conflict_detection',
    name: 'Spatial-Temporal Conflict Detection Engine',
    layer: '4. AI Intelligence & Risk',
    status: 'IMPLEMENTED',
    purpose: 'Evaluates candidate block windows against all 9 railway conflict categories.',
    inputs: ['Candidate block window', 'Train schedules', 'Adjacent block requests', 'Traction power boundaries'],
    outputs: ['Conflict list', 'Severity ratings (BLOCKING/WARNING)', 'Feasibility resolution options'],
    technology: 'Interval overlap trees, PostGIS spatial intersection, 9-Class Conflict Validator',
    details: 'Detects Train vs Block clashes, Interlocking overlaps, Maintenance resource collisions, and 25kV Traction isolation boundaries.',
    icon: SlidersHorizontal
  },
  {
    id: 'train_impact',
    name: 'Train Impact & Delay Estimator',
    layer: '4. AI Intelligence & Risk',
    status: 'IMPLEMENTED',
    purpose: 'Calculates expected passenger and freight train delays caused by track possession closures.',
    inputs: ['Block corridor section', 'Planned possession start & end', 'Train timetable schedules'],
    outputs: ['Total delay minutes', 'Affected train list', 'Rerouting and regulation recommendations'],
    technology: 'Timetable variance propagation model, headway buffer simulation',
    details: 'Quantifies operational friction, penalizing passenger express delays higher than freight rake re-timings.',
    icon: Train
  },

  // ── LAYER 5: OPTIMIZATION ENGINE
  {
    id: 'or_tools',
    name: 'Google OR-Tools CP-SAT Optimizer',
    layer: '5. Mathematical Optimization Core',
    status: 'IMPLEMENTED',
    purpose: 'Solves the multi-objective combinatorial possession scheduling integer program.',
    inputs: ['Maintenance task pool', 'Feasible zero-delay time windows', 'Objective weightings', 'Safety constraints'],
    outputs: ['Mathematically optimal BlockPlan', 'Bundled multi-discipline tasks', 'Time savings breakdown'],
    technology: 'Google OR-Tools CP-SAT (Constraint Programming - Satisfiability) Integer Solver',
    details: 'Live branch-and-bound integer program formulation executing exact constraint satisfaction in under 500ms.',
    icon: Cpu
  },

  // ── LAYER 6: MULTI-DEPARTMENT COORDINATION
  {
    id: 'shared_blocks',
    name: 'Multi-Horizon Planner & Shared Block Bundler',
    layer: '6. Operational Planning & Bundling',
    status: 'IMPLEMENTED',
    purpose: 'Consolidates uncoordinated departmental requests (Civil Track + S&T + Electrical Traction) into unified shared blocks.',
    inputs: ['Optimizer outputs', 'Department equipment availability', 'Traction shutoff requirements'],
    outputs: ['Consolidated Shared Blocks', '24-Hour Timeline Matrix', '7-Day & 30-Day Horizon Schedules'],
    technology: 'Multi-Horizon Planning Engine (Daily, Weekly, Monthly), Cross-Discipline Task Bundler',
    details: 'Transforms 3 individual closures (270 min downtime) into 1 coordinated shared possession (120 min downtime), saving 55.6% track outage.',
    icon: Layers
  },

  // ── LAYER 7: DIGITAL TWIN SIMULATION
  {
    id: 'digital_twin',
    name: 'Discrete-Event Digital Twin Simulation',
    layer: '7. Simulation & Verification',
    status: 'IMPLEMENTED',
    purpose: 'Simulates train kinematics, block activations, signal clearances, and freight gap validation in virtual real-time.',
    inputs: ['Active scenario', 'Corridor track topology', 'Moving trains', 'Block possession plans'],
    outputs: ['Dynamic train positions', 'Signal aspect states', 'Simulated train delay KPIs'],
    technology: 'Discrete-Event Kinematic Simulation Engine, HTML5 Canvas Rendering, Stepwise Clock Controller',
    details: 'Validates operational safety before field execution. Allows stepping through scenarios (e.g. SHARED_BLOCK_OPTIMIZATION) at 1x to 60x speed.',
    icon: Activity
  },

  // ── LAYER 8: HUMAN APPROVAL & GOVERNANCE
  {
    id: 'approval_rbac',
    name: 'Control Officer Review & RBAC Governance',
    layer: '8. Governance & Safety Interlocks',
    status: 'IMPLEMENTED',
    purpose: 'Enforces human-in-the-loop operational safety governance and statutory possession authorization.',
    inputs: ['AI Recommended BlockPlan', 'Control Officer decision (APPROVE / MODIFY / REJECT)'],
    outputs: ['Published Operational Possession Order', 'Immutable cryptographic audit record in audit_logs'],
    technology: 'Role-Based Access Control (RBAC), JWT Authentication, Immutable Audit Trail Service',
    details: 'Guarantees that RAILOPT AI remains a decision-support platform. Human Section Control Officers hold final operational authority.',
    icon: ShieldCheck
  },

  // ── LAYER 9: ANALYTICS & COMMAND CENTER
  {
    id: 'command_center',
    name: 'Executive Command Center & Telemetry',
    layer: '9. Analytics & Decision Support',
    status: 'IMPLEMENTED',
    purpose: 'Delivers real-time operational awareness, KPI tracking, PDF report generation, and event notifications.',
    inputs: ['Live telemetry', 'Asset availability curves', 'Block execution logs'],
    outputs: ['Executive Dashboard UI', 'Official Daily/Weekly PDF Reports', 'Real-time WebSocket alerts'],
    technology: 'React 18, TailwindCSS, Recharts, ReportLab PDF Engine, WebSocket Event Bus',
    details: 'Enables 10-second situational awareness across network health, active blocks, and impending timetable risks.',
    icon: Sparkles
  }
]

export const ArchitecturePage: React.FC = () => {
  const [selectedComp, setSelectedComp] = useState<ArchComponent>(ARCH_COMPONENTS[12]) // Default: OR-Tools
  const [activeFilter, setActiveFilter] = useState<string>('ALL')

  const layers = [
    { key: 'ALL', label: 'Complete Architecture Flow' },
    { key: '1. External Railway Feeds', label: '1. Data Sources' },
    { key: '3. Core Data Foundation', label: '2. Unified Model (CRDM)' },
    { key: '4. AI Intelligence & Risk', label: '3. AI Intelligence' },
    { key: '5. Mathematical Optimization Core', label: '4. CP-SAT Solver' },
    { key: '7. Simulation & Verification', label: '5. Digital Twin' },
    { key: '8. Governance & Safety Interlocks', label: '6. Human Governance' }
  ]

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                RAILOPT AI
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                System Architecture & Data Pipeline Blueprint
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                END-TO-END VERIFIED PIPELINE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive architectural data flow from legacy railway systems through AI modeling, Google OR-Tools optimization, and human governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
              Click any component to inspect inputs, outputs & algorithms
            </span>
          </div>
        </div>
      </div>

      {/* ── Architectural Layer Filters ──────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
        {layers.map((l) => (
          <button
            key={l.key}
            onClick={() => setActiveFilter(l.key)}
            className={cn(
              'px-3 py-1.5 rounded-md font-semibold transition-all',
              activeFilter === l.key
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* ── Main Layout: Pipeline Canvas (Left) + Inspector Drawer (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── PIPELINE FLOW DIAGRAM (2 Columns) ───────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Section 1: External Feeds */}
          {(activeFilter === 'ALL' || activeFilter === '1. External Railway Feeds') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Server className="w-3.5 h-3.5" />
                <span>1. External Railway Data Sources & Feeds</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ARCH_COMPONENTS.filter(c => c.layer === '1. External Railway Feeds').map((comp) => {
                  const Icon = comp.icon
                  const isSelected = selectedComp?.id === comp.id
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition-all relative',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{comp.id.toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-1">{comp.name}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono font-bold px-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        SYNTHETIC FEED
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-center my-1 text-slate-400">
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          )}

          {/* Section 2: Integration & URDM Core */}
          {(activeFilter === 'ALL' || activeFilter === '3. Core Data Foundation') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Database className="w-3.5 h-3.5" />
                <span>2. Ingestion & Unified Railway Data Model (URDM / CRDM)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ARCH_COMPONENTS.filter(c => c.layer === '2. Ingestion & Standardization' || c.layer === '3. Core Data Foundation').map((comp) => {
                  const Icon = comp.icon
                  const isSelected = selectedComp?.id === comp.id
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{comp.name}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          {comp.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{comp.purpose}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-center my-1 text-slate-400">
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          )}

          {/* Section 3: AI Intelligence & Risk Modeling */}
          {(activeFilter === 'ALL' || activeFilter === '4. AI Intelligence & Risk') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Bot className="w-3.5 h-3.5" />
                <span>3. AI Operational Intelligence & Conflict Analysis</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ARCH_COMPONENTS.filter(c => c.layer === '4. AI Intelligence & Risk').map((comp) => {
                  const Icon = comp.icon
                  const isSelected = selectedComp?.id === comp.id
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={cn(
                        'p-2.5 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 ring-1 ring-purple-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      )}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{comp.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">{comp.purpose}</p>
                      <span className="inline-block mt-1 text-[9px] font-mono font-bold px-1 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                        IMPLEMENTED
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-center my-1 text-slate-400">
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          )}

          {/* Section 4: Google OR-Tools CP-SAT Optimization Core */}
          {(activeFilter === 'ALL' || activeFilter === '5. Mathematical Optimization Core') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <Cpu className="w-3.5 h-3.5" />
                <span>4. Mathematical Optimization & Possession Bundling Core</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ARCH_COMPONENTS.filter(c => c.layer === '5. Mathematical Optimization Core' || c.layer === '6. Operational Planning & Bundling').map((comp) => {
                  const Icon = comp.icon
                  const isSelected = selectedComp?.id === comp.id
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={cn(
                        'p-3.5 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60 hover:border-blue-400'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{comp.name}</span>
                        </div>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
                          SOLVER CORE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{comp.purpose}</p>
                    </button>
                  )
                })}
              </div>
              <div className="flex justify-center my-1 text-slate-400">
                <ArrowDown className="w-4 h-4 animate-bounce" />
              </div>
            </div>
          )}

          {/* Section 5: Digital Twin, Governance & Analytics */}
          {(activeFilter === 'ALL' || activeFilter === '7. Simulation & Verification' || activeFilter === '8. Governance & Safety Interlocks') && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>5. Digital Twin Simulation, Control Officer Governance & Analytics</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {ARCH_COMPONENTS.filter(c => c.layer === '7. Simulation & Verification' || c.layer === '8. Governance & Safety Interlocks' || c.layer === '9. Analytics & Decision Support').map((comp) => {
                  const Icon = comp.icon
                  const isSelected = selectedComp?.id === comp.id
                  return (
                    <button
                      key={comp.id}
                      onClick={() => setSelectedComp(comp)}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">{comp.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 line-clamp-2">{comp.purpose}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── COMPONENT INSPECTOR DRAWER (Right Column) ───────────── */}
        <div className="space-y-4">
          <Card className="sticky top-20 border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Component Inspector
                  </CardTitle>
                </div>
                <Badge
                  variant={selectedComp.status === 'IMPLEMENTED' ? 'success' : selectedComp.status.includes('SIMULATED') ? 'warning' : 'info'}
                  size="sm"
                >
                  {selectedComp.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase block">{selectedComp.layer}</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedComp.name}</h3>
                <p className="text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{selectedComp.purpose}</p>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Underlying Technology & Stack</span>
                <p className="font-mono text-xs font-semibold text-blue-700 dark:text-blue-300">{selectedComp.technology}</p>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Inputs (Upstream Data Flow)</span>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {selectedComp.inputs.map((inp, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-blue-500 font-bold">↳</span>
                      <span>{inp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Outputs (Downstream Data Contracts)</span>
                <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {selectedComp.outputs.map((out, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{out}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Safety & Technical Implementation</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">
                  {selectedComp.details}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default ArchitecturePage
