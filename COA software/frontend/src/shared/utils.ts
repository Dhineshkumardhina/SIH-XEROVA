import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Priority } from '../types/maintenance'
import type { BlockStatus } from '../types/block'

/** Merge tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Priority → Tailwind color classes */
export function priorityColor(p?: Priority | string | null) {
  if (!p) return 'text-slate-400 bg-slate-500/15 border-slate-500/30'
  const map: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/30',
    HIGH: 'text-orange-400 bg-orange-500/15 border-orange-500/30',
    MEDIUM: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30',
    LOW: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
  }
  return map[p] ?? 'text-slate-400 bg-slate-500/15 border-slate-500/30'
}

/** Health score → Tailwind color classes */
export function healthColor(score: number): string {
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/15'
  if (score >= 60) return 'text-yellow-400 bg-yellow-500/15'
  return 'text-red-400 bg-red-500/15'
}

/** Block status → Tailwind color classes */
export function statusColor(s?: BlockStatus | string | null) {
  if (!s) return 'text-slate-400 bg-slate-500/15'
  const map: Record<string, string> = {
    PENDING: 'text-yellow-400 bg-yellow-500/15',
    APPROVED: 'text-emerald-400 bg-emerald-500/15',
    EXECUTED: 'text-blue-400 bg-blue-500/15',
    RECOMMENDED: 'text-purple-400 bg-purple-500/15',
    REJECTED: 'text-red-400 bg-red-500/15',
    IN_PROGRESS: 'text-blue-400 bg-blue-500/15',
    COMPLETED: 'text-emerald-400 bg-emerald-500/15',
    CANCELLED: 'text-slate-400 bg-slate-500/15',
    DRAFT: 'text-slate-400 bg-slate-500/15',
    SUBMITTED: 'text-blue-400 bg-blue-500/15',
    AI_ANALYZED: 'text-purple-400 bg-purple-500/15',
  }
  return map[s] ?? 'text-slate-400 bg-slate-500/15'
}

/** Format datetime string to human-readable */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  return `${formatDate(iso)} ${formatTime(iso)}`
}

/** Relative time (e.g. "3 days ago") */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '—'
  const seconds = Math.floor(
    (Date.now() - new Date(iso).getTime()) / 1000
  )

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}
