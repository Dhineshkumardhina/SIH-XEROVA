import React from 'react'
import { cn } from '../../shared/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated'
}

export const Card: React.FC<CardProps> = ({ className, variant = 'default', children, ...props }) => {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm',
    subtle: 'bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800/80',
    elevated: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md',
  }

  return (
    <div className={cn('rounded-xl p-5', variantStyles[variant], className)} {...props}>
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80 mb-4', className)} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-100 uppercase', className)} {...props}>
    {children}
  </h3>
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs text-slate-500 dark:text-slate-400 mt-0.5', className)} {...props}>
    {children}
  </p>
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('space-y-3', className)} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-end gap-2', className)} {...props}>
    {children}
  </div>
)

export default Card
