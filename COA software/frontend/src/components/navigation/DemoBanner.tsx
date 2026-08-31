import React from 'react'
import { cn } from '../../shared/utils'

export interface DemoBannerProps {
  className?: string
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 select-none',
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      <span>DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA</span>
    </div>
  )
}

export default DemoBanner
