import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '../../shared/utils'
import { Pagination, type PaginationProps } from './Pagination'
import { LoadingState } from './LoadingState'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField?: keyof T | ((item: T) => string)
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
  emptyMessage?: string
  sortColumn?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: string) => void
  pagination?: PaginationProps
  className?: string
  onRowClick?: (item: T) => void
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = 'No records found',
  sortColumn,
  sortDirection,
  onSort,
  pagination,
  className,
  onRowClick,
}: TableProps<T>) {
  const getKey = (item: T, idx: number): string => {
    if (typeof keyField === 'function') return keyField(item)
    return item[keyField] ? String(item[keyField]) : String(idx)
  }

  return (
    <div className={cn('w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col', className)}>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse text-xs">
          {/* Sticky Table Header */}
          <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
            <tr>
              {columns.map((col) => {
                const isSorted = sortColumn === col.key
                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => col.sortable && onSort?.(col.key)}
                    className={cn(
                      'px-4 py-3 font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 select-none',
                      col.sortable && 'cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors',
                      col.className
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-blue-500" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <LoadingState message="Loading data..." />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <ErrorState message={error} onRetry={onRetry} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <EmptyState title="No records" description={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((item, idx) => (
                <tr
                  key={getKey(item, idx)}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 text-slate-800 dark:text-slate-200', col.className)}>
                      {col.render ? col.render(item) : item[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Optional Attached Pagination */}
      {!isLoading && !error && pagination && <Pagination {...pagination} />}
    </div>
  )
}

export default Table
