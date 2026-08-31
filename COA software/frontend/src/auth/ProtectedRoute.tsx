import React from 'react'
import { Navigate, useLocation, Outlet, Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'

export interface ProtectedRouteProps {
  children?: React.ReactNode
  requiredRole?: string
  allowedRoles?: string[]
  requiredPermission?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  allowedRoles,
  requiredPermission,
}) => {
  const location = useLocation()
  const { isAuthenticated, hasRole, hasAnyRole, hasPermission, currentUser, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Verifying authorization...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check required single role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">403 — Access Restricted</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-2">
          Your active account (<span className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser?.username}</span>)
          lacks the required role (<span className="text-amber-600 dark:text-amber-400 font-mono">{requiredRole}</span>) to access this module.
        </p>
        <Link to="/dashboard" className="mt-6">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  // Check allowed roles array
  if (allowedRoles && allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">403 — Role Privilege Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-2">
          This operational view requires one of the following roles: {allowedRoles.join(', ')}
        </p>
        <Link to="/dashboard" className="mt-6">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">403 — Permission Required</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-2">
          Your account is missing operational capability: <span className="text-red-500 font-mono">{requiredPermission}</span>
        </p>
        <Link to="/dashboard" className="mt-6">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return children ? <>{children}</> : <Outlet />
}

export default ProtectedRoute
