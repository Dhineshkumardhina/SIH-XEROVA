import { useState } from 'react'
import { ShieldCheck, Users, Settings, Save, Plus, Trash2, Edit } from 'lucide-react'
import { cn } from '../shared/utils'

interface User {
  id: string
  name: string
  role: 'Super Admin' | 'COA Officer' | 'Block Controller' | 'Viewer'
  department: string
  email: string
  active: boolean
}

const mockUsers: User[] = [
  { id: 'U-001', name: 'R.K. Sharma', role: 'Super Admin', department: 'COA', email: 'rk.sharma@rail.gov.in', active: true },
  { id: 'U-002', name: 'A. Patel', role: 'COA Officer', department: 'COA', email: 'a.patel@rail.gov.in', active: true },
  { id: 'U-003', name: 'S. Verma', role: 'Block Controller', department: 'TMS', email: 's.verma@rail.gov.in', active: true },
  { id: 'U-004', name: 'M. Singh', role: 'Block Controller', department: 'TDMS', email: 'm.singh@rail.gov.in', active: false },
  { id: 'U-005', name: 'K. Devi', role: 'Viewer', department: 'SMMS', email: 'k.devi@rail.gov.in', active: true },
]

type Tab = 'users' | 'settings'

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('users')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-amber-400" />
          Admin Panel
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage users, roles, and system configuration.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            tab === 'users'
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Users className="w-4 h-4" /> Users
        </button>
        <button
          onClick={() => setTab('settings')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
            tab === 'settings'
              ? 'bg-blue-500/20 text-blue-300'
              : 'text-slate-400 hover:text-slate-200'
          )}
        >
          <Settings className="w-4 h-4" /> System Settings
        </button>
      </div>

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">User Management</h2>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors">
              <Plus className="w-3 h-3" /> Add User
            </button>
          </div>
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-200 font-medium">{user.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-bold',
                          user.role === 'Super Admin'
                            ? 'bg-amber-500/15 text-amber-400'
                            : user.role === 'COA Officer'
                            ? 'bg-blue-500/15 text-blue-400'
                            : user.role === 'Block Controller'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-slate-700/50 text-slate-400'
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{user.department}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.active ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="max-w-2xl space-y-4">
          <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-200">System Configuration</h2>

            <label className="block">
              <span className="text-xs text-slate-400 block mb-1">API Base URL</span>
              <input
                type="text"
                defaultValue="http://localhost:8000"
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>

            <label className="block">
              <span className="text-xs text-slate-400 block mb-1">Default Corridor</span>
              <select className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                <option>Section A-B</option>
                <option>Station Bravo Yard</option>
                <option>Km 52 – Km 56</option>
                <option>Section C-D</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs text-slate-400 block mb-1">Max Train Impact Threshold</span>
              <input
                type="number"
                defaultValue={3}
                min={0}
                className="w-full px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/40 bg-slate-700"
              />
              <span className="text-sm text-slate-300">Enable AI Auto-Recommendations</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/40 bg-slate-700"
              />
              <span className="text-sm text-slate-300">Send Email Alerts for Critical Defects</span>
            </label>

            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
