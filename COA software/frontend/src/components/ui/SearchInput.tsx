import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../shared/utils'

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  className,
  ...props
}) => {
  return (
    <div className={cn('relative flex items-center w-full', className)}>
      <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-9 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-colors'
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="absolute right-2.5 p-0.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
