import React from 'react'
import { cn } from '../../shared/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'elevated'
}

export const Card: React.FC<CardProps> = ({ className, variant = 'default', children, ...props }) => {
  const variantStyles = {
    default: 'bg-white border border-slate-200 shadow-none',
    subtle: 'bg-slate-50 border border-slate-200/80 shadow-none',
    elevated: 'bg-white border border-slate-200 shadow-sm',
  }

  return (
    <div className={cn('rounded-[10px] p-5', variantStyles[variant], className)} {...props}>
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('flex items-center justify-between pb-3 border-b border-slate-100 mb-4', className)} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => (
  <h3 className={cn('text-xs font-semibold tracking-wider text-slate-900 uppercase', className)} {...props}>
    {children}
  </h3>
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => (
  <p className={cn('text-xs text-slate-500 mt-0.5', className)} {...props}>
    {children}
  </p>
)

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('space-y-3', className)} {...props}>
    {children}
  </div>
)

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={cn('pt-3 border-t border-slate-100 mt-4 flex items-center justify-end gap-2', className)} {...props}>
    {children}
  </div>
)

export default Card
