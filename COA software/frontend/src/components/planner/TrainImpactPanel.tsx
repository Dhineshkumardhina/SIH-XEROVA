import React from 'react'
import {
  Train,
  Clock,
  Users,
  Box,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import type { TrainImpactData, AlternativeWindow, TrainImpactLevel } from '../../types/trainImpact'

interface TrainImpactPanelProps {
  data: TrainImpactData
  onSelectAlternative?: (alt: AlternativeWindow) => void
  isLoading?: boolean
  readOnly?: boolean
}

export const TrainImpactPanel: React.FC<TrainImpactPanelProps> = ({
  data,
  onSelectAlternative,
  readOnly = false
}) => {
  const { summary, trains, alternatives, explanation_bullets, recommendation } = data

  const getImpactColor = (level: TrainImpactLevel) => {
    switch (level) {
      case 'NO_IMPACT':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
      case 'LOW':
        return 'text-green-400 border-green-500/30 bg-green-500/10'
      case 'MEDIUM':
        return 'text-amber-400 border-amber-500/30 bg-amber-500/10'
      case 'HIGH':
        return 'text-orange-400 border-orange-500/30 bg-orange-500/10'
      case 'CRITICAL':
        return 'text-red-400 border-red-500/30 bg-red-500/10'
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header & Synthetic Disclaimer ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-700/60 bg-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">Train Impact Simulation</h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getImpactColor(summary.operational_impact)}`}>
                {summary.operational_impact} IMPACT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Window: <span className="font-mono text-slate-200">{data.start_time} – {data.end_time}</span> ({data.duration_minutes} min)
              {data.corridor_name ? ` • Corridor: ${data.corridor_name}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-mono px-2 py-1 rounded bg-slate-700/40 border border-slate-600/40 text-slate-400">
            SYNTHETIC DEMONSTRATION — SIMULATION RESULT
          </span>
        </div>
      </div>

      {/* ── KPI Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Impact Score</span>
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {summary.impact_score}<span className="text-xs text-slate-500">/100</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2">
            <div
              className={`h-1.5 rounded-full ${
                summary.impact_score > 70 ? 'bg-red-500' : summary.impact_score > 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, summary.impact_score))}%` }}
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Affected Trains</span>
            <Train className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{summary.affected_trains}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {summary.up_trains} UP • {summary.down_trains} DOWN
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Expected Delay</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">{summary.expected_delay_minutes}m</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Max: {summary.maximum_delay_minutes}m</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Passenger Trains</span>
            <Users className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{summary.passenger_trains}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            ~{summary.total_passengers_estimated.toLocaleString()} pax
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Goods / Freight</span>
            <Box className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{summary.goods_trains}</div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            {summary.special_trains > 0 ? `+${summary.special_trains} Special` : 'Freight movements'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/30">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Feasibility</span>
            {summary.is_acceptable ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            )}
          </div>
          <div className={`text-sm font-bold font-mono mt-1 ${summary.is_acceptable ? 'text-emerald-400' : 'text-red-400'}`}>
            {summary.is_acceptable ? 'ACCEPTABLE' : 'HIGH IMPACT'}
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">Priority: {summary.highest_priority}</div>
        </div>
      </div>

      {/* ── AI Explanation & Recommendation ────────────────────────── */}
      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Info className="w-4 h-4 text-blue-400" />
            <span>OPERATIONAL IMPACT EXPLAINABILITY</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5 text-xs text-slate-300">
              {explanation_bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{bullet}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-950/20 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                  AI Recommendation
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">{recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Affected Trains Table ─────────────────────────────────── */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Train className="w-4 h-4 text-slate-400" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Affected Train Services ({trains.length})
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">5-min operational buffer included</span>
          </div>

          {trains.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-2 opacity-80" />
              No train services are scheduled to operate or overlap during this maintenance window.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700/60 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-2.5 px-3">Train</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Dir</th>
                    <th className="py-2.5 px-3">Schedule</th>
                    <th className="py-2.5 px-3">Overlap</th>
                    <th className="py-2.5 px-3">Est. Delay</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Impact</th>
                    <th className="py-2.5 px-3">Reason / Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {trains.map((t) => (
                    <tr key={t.train_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-bold text-blue-400">{t.train_number}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{t.train_name}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">{t.train_type}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{t.direction}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                        {t.scheduled_entry} – {t.scheduled_exit}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{t.overlap_minutes}m</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{t.estimated_delay_minutes}m</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{t.priority_label}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${getImpactColor(t.impact_level)}`}>
                          {t.impact_level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400 max-w-[220px] truncate" title={t.reason}>
                        {t.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* ── Alternative Windows Ranking ───────────────────────────── */}
      {alternatives && alternatives.length > 0 && (
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Alternative Lower-Impact Possession Windows
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Ranked by lowest train disruption</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {alternatives.map((alt, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    alt.feasible
                      ? 'border-slate-700/60 bg-slate-800/40 hover:border-slate-600'
                      : 'border-red-900/40 bg-red-950/10 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-sm text-slate-100">
                        {alt.start_time} – {alt.end_time}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase ${getImpactColor(alt.impact_level)}`}>
                        {alt.impact_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 my-2 pt-2 border-t border-slate-700/40">
                      <div>
                        <span>Trains: </span>
                        <strong className="text-slate-200">{alt.affected_trains}</strong>
                      </div>
                      <div>
                        <span>Est. Delay: </span>
                        <strong className="text-amber-400">{alt.expected_delay_minutes}m</strong>
                      </div>
                      <div className="col-span-2 text-[10px] text-slate-400 italic truncate" title={alt.reason}>
                        {alt.reason}
                      </div>
                    </div>
                  </div>

                  {!readOnly && onSelectAlternative && alt.feasible && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10 justify-center"
                      onClick={() => onSelectAlternative(alt)}
                    >
                      Use Recommended Window <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
