import React from 'react'
import { cn } from '../../shared/utils'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}) => {
  return (
    <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800', className)}>
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <a href={b.href} className="hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-slate-800 dark:text-slate-200">{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{subtitle}</p>}
      </div>

      {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
    </div>
  )
}

export default PageHeader
