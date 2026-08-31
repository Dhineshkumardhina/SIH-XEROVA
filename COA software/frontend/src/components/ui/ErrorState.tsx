import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '../../shared/utils'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load data',
  message = 'The backend service might be temporarily unavailable.',
  onRetry,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />} className="mt-4">
          Retry
        </Button>
      )}
    </div>
  )
}

export default ErrorState
