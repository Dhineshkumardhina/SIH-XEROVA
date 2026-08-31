import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '../../types/common'
import { Button } from './Button'

export interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}) => {
  const startItem = meta.total === 0 ? 0 : (meta.page - 1) * meta.page_size + 1
  const endItem = Math.min(meta.page * meta.page_size, meta.total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <span>
          Showing <span className="font-semibold text-slate-900 dark:text-slate-200">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-200">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-200">{meta.total}</span> records
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-4">
            <span>Per page:</span>
            <select
              value={meta.page_size}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.has_prev}
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="px-2 py-1 font-mono text-xs">
          Page {meta.page} of {Math.max(1, meta.total_pages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.has_next}
          aria-label="Next Page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default Pagination
