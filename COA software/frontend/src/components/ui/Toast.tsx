import React from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '../../shared/utils'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

export interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  }

  const borderMap = {
    success: 'border-emerald-500/40',
    error: 'border-red-500/40',
    warning: 'border-amber-500/40',
    info: 'border-blue-500/40',
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-lg max-w-sm w-full animate-in slide-in-from-top-2 duration-200',
        borderMap[toast.type]
      )}
    >
      {iconMap[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{toast.title}</h4>
        {toast.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{toast.message}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast
