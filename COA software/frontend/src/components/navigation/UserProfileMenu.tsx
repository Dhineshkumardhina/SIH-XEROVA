import React from 'react'
import { User as UserIcon, Shield, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Dropdown, DropdownItem } from '../ui/Dropdown'
import { useAuthStore } from '../../store/authStore'

export const UserProfileMenu: React.FC = () => {
  const { currentUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const primaryRole = currentUser?.roles?.[0]?.replace(/_/g, ' ') || 'VIEWER'
  const departmentName = currentUser?.department?.code || ''
  const displayName = currentUser?.full_name || currentUser?.username || 'Operator'

  return (
    <Dropdown
      trigger={
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors select-none">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="text-left hidden md:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[120px]">
                {displayName}
              </span>
              {departmentName && (
                <span className="text-[9px] font-mono uppercase bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-800/60">
                  {departmentName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-0.5">
              <Shield className="w-2.5 h-2.5 text-blue-500" />
              <span>{primaryRole}</span>
            </div>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      }
      align="right"
      className="w-56"
    >
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
        <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{displayName}</p>
        <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || 'operator@railopt.gov.in'}</p>
      </div>

      <div className="py-1">
        <DropdownItem icon={<UserIcon className="w-4 h-4" />} onClick={() => navigate('/admin')}>
          Account Profile
        </DropdownItem>
        <DropdownItem icon={<Settings className="w-4 h-4" />} onClick={() => navigate('/admin/system')}>
          Preferences & Settings
        </DropdownItem>
      </div>

      <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
        <DropdownItem
          icon={<LogOut className="w-4 h-4 text-red-500" />}
          onClick={handleLogout}
          className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
        >
          Sign Out
        </DropdownItem>
      </div>
    </Dropdown>
  )
}

export default UserProfileMenu
