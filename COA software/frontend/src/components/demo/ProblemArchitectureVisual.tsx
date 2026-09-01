import React from 'react'
import {
  Layers,
  ArrowDown,
  Sparkles,
  Zap,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

export const ProblemArchitectureVisual: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* ── Key Message Banner ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-indigo-900/40 border border-blue-500/40 shadow-xl text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold uppercase tracking-widest border border-blue-400/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          CORE SIH INNOVATION PRINCIPLE
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-100 uppercase tracking-wider">
          "ONE CORRIDOR → ONE INTELLIGENT BLOCK → MULTIPLE MAINTENANCE ACTIVITIES"
        </h2>
        <p className="text-xs text-slate-300 max-w-3xl mx-auto">
          Synchronizing Track, Signalling, and Electrical Overhead maintenance into unified, co-located possession windows to minimize passenger delay and maximize track availability.
        </p>
      </div>

      {/* ── Step 1: Fragmented Systems vs Orchestration Flow ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (5 cols): Problem — Legacy Silos */}
        <Card className="lg:col-span-5 border-amber-500/30 bg-amber-950/10 flex flex-col justify-between p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                  The Problem: Fragmented Systems
                </h3>
              </div>
              <Badge variant="warning">Siloed Operations</Badge>
            </div>
            
            <p className="text-xs text-slate-300 mb-4">
              Maintenance planning is currently distributed across isolated divisional software applications:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span className="font-bold text-blue-400 block">TMS</span>
                <span className="text-[10px] text-slate-400">Track Geometry & Rail Flaws</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span className="font-bold text-amber-400 block">SMMS</span>
                <span className="text-[10px] text-slate-400">Signal & Point Machines</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span className="font-bold text-purple-400 block">TDMS</span>
                <span className="text-[10px] text-slate-400">Traction & OHE Wire Wear</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-0.5">
                <span className="font-bold text-emerald-400 block">BDMS / COA</span>
                <span className="text-[10px] text-slate-400">Block Requests & Timetables</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-300">
            <span className="font-bold block text-red-200 uppercase text-[10px]">Operational Consequence:</span>
            Independent, uncoordinated requests create fragmented corridor occupation (4.5+ hours of track closure per day).
          </div>
        </Card>

        {/* Center Divider Arrow */}
        <div className="hidden lg:flex lg:col-span-2 items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-lg">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Unified Ingestion</span>
            <ArrowDown className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* Right Column (5 cols): Solution — Orchestration Layer */}
        <Card className="lg:col-span-5 border-blue-500/40 bg-blue-950/10 flex flex-col justify-between p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-blue-500/30 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                  The Innovation: Orchestration Hub
                </h3>
              </div>
              <Badge variant="success">AI Decision Support</Badge>
            </div>

            <p className="text-xs text-slate-300 mb-4">
              <strong>RAILOPT AI</strong> acts as an intelligent orchestration & decision-support layer unifying data without replacing legacy systems:
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200"><strong>CRDM Hub:</strong> Standardized multi-department track data model</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200"><strong>AI Engine:</strong> Task priority indexing & failure risk scoring</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-slate-200"><strong>OR-Tools Solver:</strong> Discrete CP-SAT joint block consolidation</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span><strong>Human Governance:</strong> Control Officer approval & audit trail mandatory.</span>
          </div>
        </Card>

      </div>
    </div>
  )
}

export default ProblemArchitectureVisual
