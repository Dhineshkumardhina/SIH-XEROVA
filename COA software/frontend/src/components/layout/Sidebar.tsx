import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Train,
  Route as RouteIcon,
  Boxes,
  AlertOctagon,
  Layers,
  Wrench,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  Lightbulb,
  Cpu,
  Calendar,
  CalendarDays,
  CalendarRange,
  Binary,
  GitBranch,
  CheckCircle,
  BarChart3,
  FileText,
  History,
  ShieldCheck,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '../../shared/utils'
import { useUIStore } from '../../store/uiStore'
import { useAuthStore } from '../../store/authStore'

interface NavSection {
  title?: string
  items: NavItemDef[]
}

interface NavItemDef {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  requiredPermission?: string
  requiredRole?: string
  allowedRoles?: string[]
}

const navSections: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Train Operations', path: '/trains', icon: Train, requiredPermission: 'TRAIN_VIEW' },
      { label: 'Corridors', path: '/corridors', icon: RouteIcon, requiredPermission: 'CORRIDOR_VIEW' },
      { label: 'Block Requests', path: '/blocks/requests', icon: Boxes, requiredPermission: 'BLOCK_VIEW' },
      { label: 'Conflicts', path: '/blocks/conflicts', icon: AlertOctagon, requiredPermission: 'BLOCK_VIEW' },
    ],
  },
  {
    title: 'Maintenance',
    items: [
      { label: 'Assets', path: '/assets', icon: Layers, requiredPermission: 'ASSET_VIEW' },
      { label: 'Maintenance', path: '/maintenance', icon: Wrench, requiredPermission: 'MAINTENANCE_VIEW' },
      { label: 'Defects', path: '/defects', icon: AlertTriangle, requiredPermission: 'DEFECT_VIEW' },
    ],
  },
  {
    title: 'AI Intelligence',
    items: [
      { label: 'AI Priority', path: '/ai/priority', icon: Sparkles, requiredPermission: 'AI_VIEW' },
      { label: 'AI Risk', path: '/ai/risk', icon: ShieldAlert, requiredPermission: 'AI_VIEW' },
      { label: 'Recommendations', path: '/ai/recommendations', icon: Lightbulb, requiredPermission: 'AI_VIEW' },
      { label: 'AI Planner', path: '/planner/ai', icon: Cpu, requiredPermission: 'BLOCK_VIEW' },
    ],
  },
  {
    title: 'Planning',
    items: [
      { label: 'Daily Planner', path: '/planner/daily', icon: Calendar, requiredPermission: 'BLOCK_VIEW' },
      { label: 'Weekly Planner', path: '/planner/weekly', icon: CalendarDays, requiredPermission: 'BLOCK_VIEW' },
      { label: 'Monthly Planner', path: '/planner/monthly', icon: CalendarRange, requiredPermission: 'BLOCK_VIEW' },
    ],
  },
  {
    title: 'Simulation',
    items: [
      { label: 'Digital Twin', path: '/simulation/digital-twin', icon: Binary, requiredPermission: 'SIMULATION_VIEW' },
      { label: 'Scenarios', path: '/simulation/scenarios', icon: GitBranch, requiredPermission: 'SIMULATION_VIEW' },
      { label: 'Results', path: '/simulation/results', icon: CheckCircle, requiredPermission: 'SIMULATION_VIEW' },
    ],
  },
  {
    title: 'Analytics & Reports',
    items: [
      { label: 'Analytics', path: '/analytics', icon: BarChart3, requiredPermission: 'ANALYTICS_VIEW' },
      { label: 'Reports', path: '/reports', icon: FileText, requiredPermission: 'REPORT_VIEW' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: 'Audit Trail', path: '/audit', icon: History, allowedRoles: ['SUPER_ADMIN', 'CONTROL_OFFICER'] },
      { label: 'Administration', path: '/admin', icon: ShieldCheck, requiredRole: 'SUPER_ADMIN' },
    ],
  },
]

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, mobileOpen, setMobileOpen } = useUIStore()
  const { hasRole, hasAnyRole, hasPermission, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isVisible = (item: NavItemDef): boolean => {
    if (item.requiredRole && !hasRole(item.requiredRole)) return false
    if (item.allowedRoles && !hasAnyRole(item.allowedRoles)) return false
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false
    return true
  }

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 text-white shadow-sm">
              <Train className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-sm font-black tracking-wider text-slate-900 dark:text-slate-100 uppercase truncate">
                  RAILOPT AI
                </h1>
                <p className="text-[9px] text-slate-400 font-medium truncate uppercase tracking-widest">
                  Railway Block Platform
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tagline snippet */}
        {!sidebarCollapsed && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800/80 text-[10px] text-slate-500 dark:text-slate-400 font-mono select-none">
            Intelligent Blocks. Maximum Availability.
          </div>
        )}

        {/* Navigation items */}
        <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-240px)]">
          {navSections.map((section, sIdx) => {
            const filteredItems = section.items.filter(isVisible)
            if (filteredItems.length === 0) return null

            return (
              <div key={sIdx} className="space-y-1">
                {section.title && !sidebarCollapsed && (
                  <h2 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                    {section.title}
                  </h2>
                )}
                {filteredItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors cursor-pointer',
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                        )}
                      />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  )
                })}
              </div>
            )
          })}
        </nav>
      </div>

      {/* Bottom Utility Actions */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1 bg-slate-50/50 dark:bg-slate-950/30">
        <NavLink
          to="/notifications"
          onClick={() => setMobileOpen(false)}
          title={sidebarCollapsed ? 'Notifications' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors'
          )}
        >
          <Bell className="w-4 h-4 shrink-0 text-slate-400" />
          {!sidebarCollapsed && <span>Notifications</span>}
        </NavLink>

        <NavLink
          to="/admin/system"
          onClick={() => setMobileOpen(false)}
          title={sidebarCollapsed ? 'Settings' : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors'
          )}
        >
          <Settings className="w-4 h-4 shrink-0 text-slate-400" />
          {!sidebarCollapsed && <span>Settings</span>}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          title={sidebarCollapsed ? 'Sign Out' : undefined}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer'
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>

        {/* Desktop Collapse Toggle Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden lg:flex w-full items-center justify-center py-2 mt-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 left-0 z-40 h-screen flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300',
          sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-[280px] max-w-full h-full bg-white dark:bg-slate-900 shadow-2xl z-10 flex flex-col">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar
