import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../shared/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, checked, ...props }, ref) => {
    const checkId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <label htmlFor={checkId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <div className="relative flex items-center justify-center">
          <input
            id={checkId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className="sr-only peer"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition-colors',
              'peer-checked:bg-blue-600 peer-checked:border-blue-600 text-white flex items-center justify-center',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 peer-focus-visible:ring-offset-2',
              className
            )}
          >
            {checked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
        </div>
        {label && <span className="text-sm text-slate-700 dark:text-slate-300 font-normal">{label}</span>}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
export default Checkbox
