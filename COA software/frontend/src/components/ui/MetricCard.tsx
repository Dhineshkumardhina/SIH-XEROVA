import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../../shared/utils'

export interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  status?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  description?: string
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  status = 'default',
  description,
  className,
}) => {
  const statusBorder = {
    default: 'border-slate-200 dark:border-slate-800',
    success: 'border-emerald-500/40 dark:border-emerald-500/30',
    warning: 'border-amber-500/40 dark:border-amber-500/30',
    danger: 'border-red-500/40 dark:border-red-500/30',
    info: 'border-blue-500/40 dark:border-blue-500/30',
  }

  const iconBg = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-500',
    info: 'bg-blue-500/10 text-blue-500',
  }

  return (
    <div
      className={cn(
        'rounded-xl p-4 bg-white dark:bg-slate-900 border shadow-sm transition-all',
        statusBorder[status],
        className
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</span>
        {icon && <div className={cn('p-2 rounded-lg', iconBg[status])}>{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{value}</span>
        {change && (
          <span
            className={cn(
              'inline-flex items-center text-xs font-semibold',
              trend === 'up'
                ? 'text-emerald-600 dark:text-emerald-400'
                : trend === 'down'
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-500'
            )}
          >
            {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : trend === 'down' ? <ArrowDownRight className="w-3.5 h-3.5" /> : null}
            {change}
          </span>
        )}
      </div>

      {description && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
    </div>
  )
}

export default MetricCard
