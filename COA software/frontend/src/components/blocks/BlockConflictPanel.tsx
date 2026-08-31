import React, { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Info,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  ShieldAlert
} from 'lucide-react'
import { Card } from '../ui/Card'
import { blockService } from '../../services/blocks'

interface Conflict {
  type: string
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL' | string
  description: string
  start: string
  end: string
  train_id?: string
  block_id?: string
  resolution?: string
}

interface ConflictDetail {
  has_conflict: boolean
  conflicts: Conflict[]
}

interface BlockConflictPanelProps {
  requestId: string
  status: string
}

export const BlockConflictPanel: React.FC<BlockConflictPanelProps> = ({ requestId, status }) => {
  const [data, setData] = useState<ConflictDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadConflicts = async () => {
    try {
      setIsLoading(true)
      const res = await blockService.getBlockRequestConflicts(requestId)
      setData(res.data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load conflicts')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status !== 'DRAFT') {
      loadConflicts()
    }
  }, [requestId, status])

  const getSeverityStyle = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'text-red-400 bg-red-500/10 border-red-500/30'
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
      case 'WARNING':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      case 'INFO':
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    }
  }

  if (status === 'DRAFT') {
    return (
      <Card>
        <div className="p-6 text-center">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-slate-300">Not Submitted Yet</h3>
          <p className="text-xs text-slate-400 mt-1">Submit the request to run automated conflict analysis.</p>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-8 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          <span className="text-xs text-slate-400 font-mono">Running Conflict Engine analysis...</span>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-red-400 text-xs text-center">{error}</div>
      </Card>
    )
  }

  if (!data) return null

  const criticalCount = data.conflicts.filter((c) => c.severity === 'CRITICAL').length
  const highCount = data.conflicts.filter((c) => c.severity === 'HIGH').length
  const isFeasible = criticalCount === 0 && highCount === 0

  return (
    <Card>
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Conflict & Feasibility Analysis
            </h2>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            Phase 16 Engine
          </span>
        </div>

        {/* ── Feasibility Banner ────────────────────────────────────── */}
        {!data.has_conflict ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Feasible — No Conflicts Detected</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5 leading-relaxed">
                This possession window is clear of train operations, overlapping possessions, and safety constraint violations.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-xl p-4 flex items-start gap-3 border ${
              isFeasible
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            {isFeasible ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider ${isFeasible ? 'text-amber-400' : 'text-red-400'}`}>
                {isFeasible ? 'Feasible with Operational Warnings' : 'Infeasible — Critical Conflicts Detected'}
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Found {data.conflicts.length} conflict(s): {criticalCount} critical, {highCount} high priority.
                {!isFeasible && ' Resolve critical issues before proceeding with block approval.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Conflict Items List ───────────────────────────────────── */}
        {data.conflicts.length > 0 && (
          <div className="space-y-3 pt-1">
            {data.conflicts.map((conflict, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-700/60 bg-slate-800/40 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {conflict.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${getSeverityStyle(conflict.severity)}`}>
                    {conflict.severity}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{conflict.description}</p>

                {conflict.resolution && (
                  <div className="p-2.5 rounded-lg border border-blue-500/20 bg-blue-950/20 text-[11px] text-blue-300 flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-blue-400">Resolution Suggestion: </strong>
                      <span>{conflict.resolution}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Overlap Window: {new Date(conflict.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                    {new Date(conflict.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default BlockConflictPanel
