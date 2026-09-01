import React, { useState } from 'react'
import { UserCheck, Shield, Lock, RotateCcw } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export interface DemoRoleOption {
  roleName: string
  label: string
  username: string
  color: string
  desc: string
}

export const DEMO_ROLES: DemoRoleOption[] = [
  {
    roleName: 'CONTROL_OFFICER',
    label: 'Chief Control Officer',
    username: 'control',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    desc: 'Block Approval Authority & Schedule Publishing',
  },
  {
    roleName: 'ENGINEERING_OFFICER',
    label: 'Engineering Officer',
    username: 'engineering',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    desc: 'Track Assets, Rail Flaws & Tamping Demands',
  },
  {
    roleName: 'SIGNAL_TELECOM_OFFICER',
    label: 'Signal & Telecom Officer',
    username: 'signal',
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    desc: 'Point Machines, Interlocking & SMMS Tasks',
  },
  {
    roleName: 'TRACTION_OFFICER',
    label: 'Traction OHE Officer',
    username: 'traction',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    desc: 'Overhead Contact Wire & SCADA Feeder Demands',
  },
  {
    roleName: 'VIEWER',
    label: 'Read-Only Viewer',
    username: 'viewer',
    color: 'bg-slate-800 text-slate-400 border-slate-700',
    desc: 'Auditor View (No Edit / Approval Authority)',
  },
]

const DEMO_PASSWORD = 'RailoptDemo@2026'

export const DemoRoleSwitcher: React.FC = () => {
  const { currentUser, login, isLoading } = useAuthStore()
  const [switchingRole, setSwitchingRole] = useState<string | null>(null)
  const [switchError, setSwitchError] = useState<string | null>(null)

  const handleSwitchRole = async (role: DemoRoleOption) => {
    try {
      setSwitchingRole(role.roleName)
      setSwitchError(null)
      const success = await login(role.username, DEMO_PASSWORD)
      if (!success) {
        setSwitchError(`Failed to authenticate as ${role.label}. Check backend connection.`)
      }
    } catch (err: any) {
      setSwitchError(err?.message || 'Authentication error')
    } finally {
      setSwitchingRole(null)
    }
  }

  const currentRoleName = currentUser?.roles?.[0] || 'VIEWER'

  return (
    <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            SIH Judge RBAC Role Switcher (Real API Auth)
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          ACTIVE USER: <strong className="text-slate-200">{currentUser?.username || 'GUEST'}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {DEMO_ROLES.map((r) => {
          const isActive = currentRoleName === r.roleName || (r.roleName === 'CONTROL_OFFICER' && currentUser?.roles?.includes('SUPER_ADMIN'))
          const isSwitching = switchingRole === r.roleName

          return (
            <button
              key={r.roleName}
              onClick={() => handleSwitchRole(r)}
              disabled={isLoading || isSwitching}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? `${r.color} ring-1 ring-blue-400 font-bold shadow-md`
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-mono font-semibold">
                    {r.username}
                  </span>
                  {isActive ? (
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : isSwitching ? (
                    <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-600" />
                  )}
                </div>
                <p className="text-xs font-bold truncate text-slate-100">{r.label}</p>
              </div>
              <p className="text-[9px] text-slate-400 truncate mt-1">{r.desc}</p>
            </button>
          )
        })}
      </div>

      {switchError && (
        <div className="text-[11px] text-red-400 font-mono bg-red-950/40 p-2 rounded border border-red-500/30">
          {switchError}
        </div>
      )}
    </div>
  )
}

export default DemoRoleSwitcher
