import React from 'react'
import { Inbox } from 'lucide-react'
import { cn } from '../../shared/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">{title}</h4>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export default EmptyState
