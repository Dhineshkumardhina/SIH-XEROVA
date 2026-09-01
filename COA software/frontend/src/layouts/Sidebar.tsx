import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Calendar,
  Boxes,
  BarChart3,
  ShieldCheck,
  Train,
  Cpu,
  ChevronLeft,
  ChevronRight,
  Server,
  Wrench,
  AlertTriangle,
  Route as RouteIcon,
  Bot,
  FileText,
  Layers
} from 'lucide-react'
import { cn } from '../shared/utils'
import { useUIStore } from '../shared/store'
import { useAuthStore } from '../store/authStore'

interface NavItemDef {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  requiredPermission?: string
  requiredRole?: string
}

const navItems: NavItemDef[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, requiredPermission: 'DASHBOARD_VIEW' },
  { label: 'Asset Management', path: '/assets', icon: Server, requiredPermission: 'ASSET_VIEW' },
  { label: 'Maintenance Hub', path: '/maintenance', icon: Wrench, requiredPermission: 'MAINTENANCE_VIEW' },
  { label: 'Defect Tracker', path: '/defects', icon: AlertTriangle, requiredPermission: 'DEFECT_VIEW' },
  { label: 'Train Timetable', path: '/trains', icon: Train, requiredPermission: 'TRAIN_VIEW' },
  { label: 'Corridors', path: '/corridors', icon: RouteIcon, requiredPermission: 'CORRIDOR_VIEW' },
  { label: 'Block Planner', path: '/planner', icon: Calendar, requiredPermission: 'BLOCK_VIEW' },
  { label: 'Blocks', path: '/blocks', icon: Boxes, requiredPermission: 'BLOCK_VIEW' },
  { label: 'AI Insights', path: '/ai', icon: Bot, requiredPermission: 'AI_VIEW' },
  { label: 'Simulation', path: '/simulation', icon: Cpu, requiredPermission: 'SIMULATION_VIEW' },
  { label: 'Architecture', path: '/architecture', icon: Layers, requiredPermission: 'DASHBOARD_VIEW' },
  { label: 'Operations', path: '/operations', icon: Train, requiredPermission: 'BLOCK_VIEW' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, requiredPermission: 'ANALYTICS_VIEW' },
  { label: 'Reports', path: '/reports', icon: FileText, requiredPermission: 'REPORT_VIEW' },
  { label: 'Admin', path: '/admin', icon: ShieldCheck, requiredRole: 'SUPER_ADMIN' },
]

export default function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggle = useUIStore((s) => s.toggleSidebar)
  const location = useLocation()
  const { hasPermission, hasRole } = useAuthStore()

  const visibleNavItems = navItems.filter((item) => {
    if (item.requiredRole && !hasRole(item.requiredRole)) return false
    if (item.requiredPermission && !hasPermission(item.requiredPermission)) return false
    return true
  })

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 z-40 h-screen flex flex-col',
        'bg-white border-r border-slate-200',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-200">
        <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Train className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold tracking-tight text-slate-900 whitespace-nowrap">
              RAILOPT-AI
            </h1>
            <p className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
              Block Planning Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                'transition-colors duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                )}
              />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-12 border-t border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  )
}
