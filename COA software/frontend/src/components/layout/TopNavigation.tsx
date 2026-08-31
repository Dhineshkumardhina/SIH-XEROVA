import React, { useState, useEffect } from 'react'
import { Search, Sun, Moon, Menu } from 'lucide-react'
import { DemoBanner } from '../navigation/DemoBanner'
import { NotificationDropdown } from '../navigation/NotificationDropdown'
import { UserProfileMenu } from '../navigation/UserProfileMenu'
import { useUIStore } from '../../store/uiStore'

export const TopNavigation: React.FC = () => {
  const { theme, toggleTheme, toggleMobile, setSearchOpen } = useUIStore()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const formattedDate = currentTime.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const formattedTime = currentTime.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 bg-white/90 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left Area: Mobile Menu + Operational Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            RAILWAY OPERATIONS
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            NORMAL
          </span>
        </div>

        {/* Global Search Trigger */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer ml-2"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search railway system...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Center: Demonstration Environment Banner */}
      <div className="hidden xl:flex items-center justify-center">
        <DemoBanner />
      </div>

      {/* Right Area: Clock, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Real-time Clock */}
        <div className="hidden lg:flex flex-col text-right font-mono text-xs pr-2 border-r border-slate-200 dark:border-slate-800">
          <span className="text-slate-800 dark:text-slate-200 font-semibold">{formattedTime}</span>
          <span className="text-[10px] text-slate-400">{formattedDate}</span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User Capsule */}
        <UserProfileMenu />
      </div>
    </header>
  )
}

export default TopNavigation
