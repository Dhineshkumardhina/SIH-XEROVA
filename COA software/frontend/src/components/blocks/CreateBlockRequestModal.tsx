import React, { useState, useEffect } from 'react'
import {
  X,
  Plus,
  Wrench,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { Button } from '../ui/Button'
import { blockService } from '../../services/blocks'
import { corridorService } from '../../services/corridors'
import type { BlockRequest } from '../../types/block'
import type { Corridor } from '../../types/corridor'

interface CreateBlockRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newRequest?: BlockRequest) => void
}

export const CreateBlockRequestModal: React.FC<CreateBlockRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Form Fields
  const [departmentId, setDepartmentId] = useState('ENG')
  const [corridorId, setCorridorId] = useState('')
  const [blockType, setBlockType] = useState<'MAINTENANCE' | 'EMERGENCY' | 'INSPECTION' | 'POWER_SHUTOFF'>('MAINTENANCE')
  const [priority, setPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH')
  const [reason, setReason] = useState('')
  const [isolationRequired, setIsolationRequired] = useState(false)

  // Date and Time calculation
  const now = new Date()
  const defaultStart = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const defaultEnd = new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const [startDateTime, setStartDateTime] = useState(defaultStart)
  const [endDateTime, setEndDateTime] = useState(defaultEnd)

  // Calculate Duration
  const calculateDurationMinutes = (startStr: string, endStr: string): number => {
    const s = new Date(startStr).getTime()
    const e = new Date(endStr).getTime()
    if (isNaN(s) || isNaN(e) || e <= s) return 120
    return Math.round((e - s) / (1000 * 60))
  }

  const durationMinutes = calculateDurationMinutes(startDateTime, endDateTime)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccessMsg(null)
      // Fetch Corridors
      corridorService.getCorridors({ page_size: 50 })
        .then((res) => {
          if (res?.data?.items && res.data.items.length > 0) {
            setCorridors(res.data.items)
            setCorridorId(res.data.items[0].id)
          } else {
            // Fallback default corridors
            setCorridors([
              { id: 'cor-001', code: 'COR-A01', name: 'NDLS - CNB - PRYJ Trunk', distance_km: 750, track_count: 4, electrified: true, status: 'OPERATIONAL', start_station_id: 's1', end_station_id: 's2', created_at: '', updated_at: '' },
              { id: 'cor-002', code: 'COR-B02', name: 'DER - RE - FL Western DFC', distance_km: 640, track_count: 2, electrified: true, status: 'OPERATIONAL', start_station_id: 's3', end_station_id: 's4', created_at: '', updated_at: '' },
              { id: 'cor-003', code: 'COR-C03', name: 'BPQ - KZJ - SC Southern Spine', distance_km: 480, track_count: 2, electrified: true, status: 'OPERATIONAL', start_station_id: 's5', end_station_id: 's6', created_at: '', updated_at: '' },
            ])
            setCorridorId('cor-001')
          }
        })
        .catch(() => {
          setCorridors([
            { id: 'cor-001', code: 'COR-A01', name: 'NDLS - CNB - PRYJ Trunk', distance_km: 750, track_count: 4, electrified: true, status: 'OPERATIONAL', start_station_id: 's1', end_station_id: 's2', created_at: '', updated_at: '' },
            { id: 'cor-002', code: 'COR-B02', name: 'DER - RE - FL Western DFC', distance_km: 640, track_count: 2, electrified: true, status: 'OPERATIONAL', start_station_id: 's3', end_station_id: 's4', created_at: '', updated_at: '' },
          ])
          setCorridorId('cor-001')
        })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setError('Please provide a detailed maintenance reason or scope of work.')
      return
    }
    if (durationMinutes <= 0) {
      setError('Preferred end time must be after start time.')
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      const payload = {
        department_id: departmentId,
        corridor_id: corridorId,
        preferred_start_at: new Date(startDateTime).toISOString() as any,
        preferred_end_at: new Date(endDateTime).toISOString() as any,
        duration_minutes: durationMinutes,
        block_type: blockType,
        priority,
        isolation_required: isolationRequired,
        reason: reason.trim(),
        status: 'SUBMITTED' as const,
      }

      const res = await blockService.createBlockRequest(payload)
      setSuccessMsg('Block Request created and submitted successfully!')
      setTimeout(() => {
        onSuccess(res?.data)
        onClose()
      }, 700)
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to create block request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                New Traffic Block Possession Request
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit a new maintenance window request for engineering, signaling, or traction works.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Department & Corridor Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="ENG">Engineering (Civil & Track / TMS)</option>
                <option value="SNT">Signal & Telecom (Interlocking / SMMS)</option>
                <option value="TRC">Traction (25kV OHE / TDMS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Corridor Section <span className="text-red-500">*</span>
              </label>
              <select
                value={corridorId}
                onChange={(e) => setCorridorId(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                {corridors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Block Type & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Block Type
              </label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="MAINTENANCE">Regular Maintenance Possession</option>
                <option value="EMERGENCY">Emergency Track Repair</option>
                <option value="INSPECTION">Inspection & Track Circuit Testing</option>
                <option value="POWER_SHUTOFF">25kV Power Shutoff / OHE Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="CRITICAL">Critical (Immediate Statutory Need)</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Preferred Window (Start / End / Duration) */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                Requested Possession Window
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                Duration: {durationMinutes} min ({Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Preferred Start Time
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Preferred End Time
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Safety & Isolation Option */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <input
              type="checkbox"
              id="isolation-req"
              checked={isolationRequired}
              onChange={(e) => setIsolationRequired(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
            />
            <label htmlFor="isolation-req" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span><strong>25kV OHE Overhead Power Isolation Required</strong> (De-energize catenary line)</span>
            </label>
          </div>

          {/* Reason & Scope of Work */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Scope of Work & Justification <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Deep track screening, point machine calibration, and catenary tensioning at Km 185-215."
              rows={3}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Submit Block Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBlockRequestModal
