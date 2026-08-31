import React from 'react'
import { cn } from '../../shared/utils'

export interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between gap-4 mb-4', className)}>
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">{title}</h2>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export default SectionHeader
