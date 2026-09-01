import React from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  SlidersHorizontal,
  Info,
  Train,
  Wrench,
  Bot
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { cn } from '../../shared/utils'

export type AIDecisionType =
  | 'PRIORITY'
  | 'RISK'
  | 'FORECAST'
  | 'TRAIN_IMPACT'
  | 'CONFLICT'
  | 'BLOCK_RECOMMENDATION'
  | 'OPTIMIZATION'

export interface ExplainabilityFactor {
  name: string
  score: number // 0 to 100
  weightPct?: number
  description?: string
  status?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NOMINAL'
}

export interface ExplainabilityAlternative {
  slot: string
  trainImpact: string
  conflictCount: number
  feasibilityScore: number // 0 to 100
  status: 'RECOMMENDED' | 'FEASIBLE' | 'HIGH_FRICTION' | 'INFEASIBLE'
}

export interface AIExplainabilityProps {
  decisionType: AIDecisionType
  title: string
  recommendation: string
  why: string[]
  factors: ExplainabilityFactor[]
  constraints: { name: string; satisfied: boolean; detail: string }[]
  alternatives?: ExplainabilityAlternative[]
  expectedImpact: { label: string; value: string; positive: boolean }[]
  modelType?: string
  compact?: boolean
  className?: string
}

export const AIExplainabilityCard: React.FC<AIExplainabilityProps> = ({
  decisionType,
  title,
  recommendation,
  why,
  factors,
  constraints,
  alternatives,
  expectedImpact,
  modelType,
  compact = false,
  className
}) => {
  const getModelLabel = () => {
    if (modelType) return modelType
    switch (decisionType) {
      case 'PRIORITY':
        return 'MODEL TYPE: Multi-Criteria Exponential Priority Scoring (Rule-Based & ML Calibration)'
      case 'RISK':
        return 'MODEL TYPE: Weibull & Exponential Asset Hazard Failure Model'
      case 'FORECAST':
        return 'MODEL TYPE: SARIMA Seasonal Freight Traffic Forecasting Engine'
      case 'TRAIN_IMPACT':
        return 'MODEL TYPE: Timetable Variance Propagation & Headway Buffer Simulation'
      case 'CONFLICT':
        return 'MODEL TYPE: 9-Class Spatial-Temporal Interval Overlap Matrix'
      case 'OPTIMIZATION':
      case 'BLOCK_RECOMMENDATION':
        return 'MODEL TYPE: Google OR-Tools CP-SAT Branch-and-Bound Integer Programming Solver'
      default:
        return 'MODEL TYPE: Decision-Support Optimization Engine'
    }
  }

  const getDomainIcon = () => {
    switch (decisionType) {
      case 'PRIORITY':
        return <Wrench className="w-4 h-4 text-amber-500" />
      case 'RISK':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />
      case 'FORECAST':
      case 'TRAIN_IMPACT':
        return <Train className="w-4 h-4 text-blue-500" />
      case 'CONFLICT':
        return <SlidersHorizontal className="w-4 h-4 text-orange-500" />
      case 'OPTIMIZATION':
      case 'BLOCK_RECOMMENDATION':
        return <Cpu className="w-4 h-4 text-purple-500" />
      default:
        return <Bot className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <Card className={cn('border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden', className)}>
      {/* Header with Model Transparency */}
      <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2">
            {getDomainIcon()}
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {title}
            </CardTitle>
          </div>
          <Badge variant="purple" size="sm">
            AI EXPLAINABILITY
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 text-xs">
        {/* 1. RECOMMENDATION */}
        <div className="p-3 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/20 space-y-1">
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
            AI Recommendation
          </span>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {recommendation}
          </p>
        </div>

        {/* 2. WHY (Operational Rationale) */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Why this decision was formulated:
          </span>
          <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
            {why.map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">↳</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3. FACTORS (Visual Factor Breakdown) */}
        <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Factor Breakdown (Multi-Criteria Attribution)
            </span>
            <span className="text-[10px] font-mono text-slate-400">0 – 100 Scale</span>
          </div>

          <div className="space-y-2">
            {factors.map((factor, idx) => {
              const scoreVal = Math.max(0, Math.min(100, Number(factor.score) || 0))
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {factor.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {factor.weightPct && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          (w: {factor.weightPct}%)
                        </span>
                      )}
                      <span className={cn(
                        'font-mono font-bold',
                        scoreVal >= 80 ? 'text-red-600 dark:text-red-400' :
                        scoreVal >= 60 ? 'text-amber-600 dark:text-amber-400' :
                        'text-emerald-600 dark:text-emerald-400'
                      )}>
                        {scoreVal.toFixed(0)} / 100
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Visualizer */}
                  <div className="h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        scoreVal >= 80 ? 'bg-red-500' :
                        scoreVal >= 60 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      )}
                      style={{ width: `${scoreVal}%` }}
                    />
                  </div>
                  {factor.description && (
                    <p className="text-[10px] text-slate-400 italic mt-0.5">{factor.description}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. CONSTRAINTS (Hard & Soft Safety Checks) */}
        {constraints && constraints.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Operational Constraints & Safety Interlocks
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {constraints.map((c, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-2 rounded border text-[11px] flex items-start gap-2',
                    c.satisfied
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300'
                  )}
                >
                  {c.satisfied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">{c.name}</span>
                    <span className="text-[10px] opacity-90">{c.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ALTERNATIVES (Ranked Alternative Options) */}
        {alternatives && alternatives.length > 0 && !compact && (
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Alternative Operational Windows Evaluated
            </span>
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-[10px] text-slate-500 uppercase">
                  <tr>
                    <th className="py-2 px-3">Time Window</th>
                    <th className="py-2 px-3">Train Delay Impact</th>
                    <th className="py-2 px-3 text-center">Conflicts</th>
                    <th className="py-2 px-3 text-center">Score</th>
                    <th className="py-2 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alternatives.map((alt, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        alt.status === 'RECOMMENDED'
                          ? 'bg-purple-50/40 dark:bg-purple-950/20 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      )}
                    >
                      <td className="py-2 px-3 font-mono">{alt.slot}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{alt.trainImpact}</td>
                      <td className="py-2 px-3 text-center font-mono">{alt.conflictCount}</td>
                      <td className="py-2 px-3 text-center font-mono">{Number(alt.feasibilityScore || 0).toFixed(0)}</td>
                      <td className="py-2 px-3 text-right">
                        <Badge
                          variant={
                            alt.status === 'RECOMMENDED' ? 'purple' :
                            alt.status === 'FEASIBLE' ? 'success' :
                            alt.status === 'HIGH_FRICTION' ? 'warning' : 'danger'
                          }
                          size="sm"
                        >
                          {alt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. EXPECTED IMPACT (Quantified Performance Payoff) */}
        {expectedImpact && expectedImpact.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {expectedImpact.map((imp, idx) => (
              <div key={idx} className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80">
                <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-bold block">{imp.label}</span>
                <span className={cn('text-xs font-mono font-bold', imp.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200')}>
                  {imp.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 7. TRANSPARENCY & LIMITATION FOOTER */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded">
            <span>{getModelLabel()}</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">100% EXPLAINABLE</span>
          </div>

          <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 p-2 rounded bg-amber-500/5 border border-amber-500/20">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              <strong>AI LIMITATION:</strong> Recommendations are decision-support outputs generated from synthetic demonstration data. Final operational decisions require authorized human review.
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AIExplainabilityCard
