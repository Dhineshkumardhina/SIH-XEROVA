import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../shared/utils'

export interface LoadingStateProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  className,
  size = 'md',
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 p-6 text-center', className)}>
      <Loader2 className={cn('animate-spin text-blue-500', sizeStyles[size])} />
      {message && <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{message}</p>}
    </div>
  )
}

export default LoadingState
