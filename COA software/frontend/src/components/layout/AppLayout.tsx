import React, { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopNavigation } from './TopNavigation'
import { GlobalSearchModal } from '../navigation/GlobalSearchModal'
import { ErrorBoundary } from './ErrorBoundary'
import { DemoGuidedNav } from '../demo/DemoGuidedNav'
import { useUIStore } from '../../store/uiStore'
import { useDemoStore } from '../../store/demoStore'
import { cn } from '../../shared/utils'

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useUIStore()
  const { isDemoActive, syncWithRoute } = useDemoStore()
  const location = useLocation()

  useEffect(() => {
    if (isDemoActive) {
      syncWithRoute(location.pathname)
    }
  }, [location.pathname, isDemoActive, syncWithRoute])

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

        <main className={cn('flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto', isDemoActive ? 'pb-24' : '')}>
          <ErrorBoundary isPageLevel fallbackTitle="Page Error">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Guided Navigation Dock for SIH Presentation Mode */}
      <DemoGuidedNav />

      {/* Global Search Modal Triggered by Ctrl+K */}
      <GlobalSearchModal />
    </div>
  )
}

export default AppLayout


