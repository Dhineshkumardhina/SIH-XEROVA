import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'
import { GlobalSearchModal } from '../navigation/GlobalSearchModal'
import { useUIStore } from '../../store/uiStore'
import { cn } from '../../shared/utils'

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[260px]'
        )}
      >
        <TopNavigation />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Search Modal Triggered by Ctrl+K */}
      <GlobalSearchModal />
    </div>
  )
}

export default AppLayout
