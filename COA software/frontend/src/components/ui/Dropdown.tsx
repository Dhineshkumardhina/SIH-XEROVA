import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../shared/utils'

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, children, align = 'right', className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => setIsOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export const DropdownItem: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode }> = ({
  children,
  icon,
  className,
  ...props
}) => (
  <button
    type="button"
    className={cn(
      'w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-left cursor-pointer',
      className
    )}
    {...props}
  >
    {icon && <span className="text-slate-400">{icon}</span>}
    {children}
  </button>
)

export default Dropdown
