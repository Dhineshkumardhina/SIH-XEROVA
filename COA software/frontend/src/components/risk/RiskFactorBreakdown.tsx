import React from 'react'
import type { RiskFactor } from '../../types/risk'

interface RiskFactorBreakdownProps {
  factors: RiskFactor[]
  compact?: boolean
}

export const RiskFactorBreakdown: React.FC<RiskFactorBreakdownProps> = ({ factors, compact = false }) => {
  if (!factors || factors.length === 0) {
    return <div className="text-xs text-slate-400 italic py-2">No factor breakdown available.</div>
  }

  const formatFactorName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'LOW':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    }
  }

  const getBarColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500'
      case 'HIGH':
        return 'bg-amber-500'
      case 'MEDIUM':
        return 'bg-yellow-500'
      case 'LOW':
      default:
        return 'bg-emerald-500'
    }
  }

  return (
    <div className={`space-y-${compact ? '2.5' : '3.5'}`}>
      {factors.map((f, idx) => {
        const contrib = Number(f.contribution) || 0
        const normVal = Number(f.normalized_value) || 0
        const weight = Number(f.weight) || 0

        return (
          <div
            key={`${f.factor}-${idx}`}
            className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600/70 transition-colors"
          >
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-200">{formatFactorName(f.factor || 'Factor')}</span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${getSeverityBadgeClass(
                    f.severity
                  )}`}
                >
                  {f.severity || 'LOW'}
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Contrib:</span>
                <span className="font-bold text-slate-100">+{contrib.toFixed(1)}</span>
              </div>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-1.5 mb-1.5 overflow-hidden">
              <div
                className={`h-1.5 rounded-full transition-all duration-300 ${getBarColor(f.severity)}`}
                style={{ width: `${Math.min(100, Math.max(0, normVal))}%` }}
              />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Raw: {String(f.raw_value ?? 'N/A')}</span>
              <span>Norm: {normVal.toFixed(0)}/100</span>
              <span>Weight: {(weight * 100).toFixed(0)}%</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RiskFactorBreakdown
