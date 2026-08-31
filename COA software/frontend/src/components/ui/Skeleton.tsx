import React from 'react'
import { cn } from '../../shared/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'text'
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rectangular',
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
    text: 'rounded h-4 w-full',
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-800',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export default Skeleton
