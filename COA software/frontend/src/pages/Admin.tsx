import React, { useState, useEffect } from 'react'
import { UserPlus, RefreshCw, Lock, Unlock, Shield, Sliders, Database, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import api from '../services/api'
import type { User } from '../types/user'
import type { PaginatedResponse } from '../types/common'

const MOCK_USERS: User[] = [
  {
    id: 'usr-admin-01',
    full_name: 'Dr. Rajesh Sharma',
    username: 'admin',
    email: 'admin@railopt.gov.in',
    roles: ['SUPER_ADMIN'],
    permissions: ['ALL_PERMISSIONS'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-01', code: 'ADMIN', name: 'Railway Board Administration' },
  },
  {
    id: 'usr-ctrl-01',
    full_name: 'Suresh Kumar Verma',
    username: 'control',
    email: 'control@railopt.gov.in',
    roles: ['CONTROL_OFFICER'],
    permissions: ['BLOCK_APPROVE', 'BLOCK_REJECT', 'CORRIDOR_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-02', code: 'OPT', name: 'Operating & Traffic' },
  },
  {
    id: 'usr-plan-01',
    full_name: 'Pooja Iyer',
    username: 'planner',
    email: 'planner@railopt.gov.in',
    roles: ['BLOCK_PLANNER'],
    permissions: ['BLOCK_REQUEST', 'OPTIMIZATION_RUN'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-02', code: 'OPT', name: 'Operating & Traffic' },
  },
  {
    id: 'usr-eng-01',
    full_name: 'Anil Deshmukh',
    username: 'engineering',
    email: 'engineering@railopt.gov.in',
    roles: ['ENGINEERING_OFFICER'],
    permissions: ['BLOCK_REQUEST', 'ASSET_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-03', code: 'ENG', name: 'Civil Engineering (Track)' },
  },
  {
    id: 'usr-sig-01',
    full_name: 'Ravi Teja',
    username: 'signal',
    email: 'signal@railopt.gov.in',
    roles: ['SIGNAL_TELECOM_OFFICER'],
    permissions: ['BLOCK_REQUEST', 'ASSET_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-04', code: 'SIG', name: 'Signaling & Telecom' },
  },
  {
    id: 'usr-trc-01',
    full_name: 'Kavita Menon',
    username: 'traction',
    email: 'traction@railopt.gov.in',
    roles: ['TRACTION_OFFICER'],
    permissions: ['BLOCK_REQUEST', 'ASSET_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-05', code: 'TRC', name: 'Electrical Traction (OHE)' },
  },
  {
    id: 'usr-view-01',
    full_name: 'Rahul Sen',
    username: 'viewer',
    email: 'viewer@railopt.gov.in',
    roles: ['VIEWER'],
    permissions: ['BLOCK_VIEW', 'CORRIDOR_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-02', code: 'OPT', name: 'Operating & Traffic' },
  },
]

const MOCK_ROLES = [
  { role: 'SUPER_ADMIN', name: 'Super Administrator', users: 1, permissions: 'Full System Control, User & RBAC Management, Audit Exports' },
  { role: 'CONTROL_OFFICER', name: 'Chief Traffic Controller (CTC)', users: 4, permissions: 'Traffic Clearance, Possession Approvals, Emergency Overrides, Corridor Locks' },
  { role: 'BLOCK_PLANNER', name: 'Block Planning Specialist', users: 6, permissions: 'OR-Tools Optimization, Corridor Bundling, Shadow Timetable Simulation' },
  { role: 'ENGINEERING_OFFICER', name: 'Civil / Track Officer', users: 12, permissions: 'Track Block Requisitions, TSR Speed Restrictions, SMMS Integration' },
  { role: 'SIGNAL_TELECOM_OFFICER', name: 'Signal & Telecom Officer', users: 8, permissions: 'Point Machine Possessions, Interlocking Failures, S&T Blocks' },
  { role: 'TRACTION_OFFICER', name: 'Traction Distribution Officer', users: 5, permissions: 'OHE Power Isolation, Feeder Shutdowns, TDMS Energy Logs' },
  { role: 'VIEWER', name: 'Operations Observer', users: 15, permissions: 'Read-only Dashboards, Train Movements, Corridor Schedules, Analytics' },
]

const MOCK_DEPARTMENTS = [
  { code: 'OPT', name: 'Operating & Traffic Management', head: 'Suresh Kumar Verma', activeTasks: 18, color: 'border-blue-500' },
  { code: 'ENG', name: 'Civil Engineering & Permanent Way', head: 'Anil Deshmukh', activeTasks: 34, color: 'border-emerald-500' },
  { code: 'SIG', name: 'Signaling & Telecommunication', head: 'Ravi Teja', activeTasks: 21, color: 'border-amber-500' },
  { code: 'TRC', name: 'Electrical Traction & Power Distribution', head: 'Kavita Menon', activeTasks: 14, color: 'border-purple-500' },
  { code: 'MECH', name: 'Mechanical & Rolling Stock', head: 'Vikram Singh', activeTasks: 9, color: 'border-cyan-500' },
  { code: 'SFT', name: 'Railway Safety & Inspection Directorate', head: 'Dr. Rajesh Sharma', activeTasks: 4, color: 'border-rose-500' },
]

const MOCK_SYSTEM_CONFIGS = [
  { param: 'MAX_BLOCK_DURATION_MINUTES', value: '240 min', category: 'Optimization', desc: 'Maximum allowable contiguous corridor block possession' },
  { param: 'OR_TOOLS_SOLVER_TIMEOUT_SECONDS', value: '30 sec', category: 'Solver', desc: 'Google CP-SAT search time limit per optimization batch' },
  { param: 'SPATIAL_CONFLICT_RADIUS_METERS', value: '5,000 m', category: 'Safety', desc: 'Proximity threshold for detecting co-located maintenance interference' },
  { param: 'MULTI_DEPT_BUNDLING_THRESHOLD', value: '85%', category: 'Bundling', desc: 'Minimum spatial-temporal overlap required for automated bundling' },
  { param: 'AUTO_OHE_ISOLATION_MANDATE', value: 'ENABLED', category: 'Safety', desc: 'Enforce automatic traction power isolation on high-voltage spans' },
]

const MOCK_DATA_FEEDS = [
  { source: 'TMS', name: 'Traffic Management System', syncTime: 'Just now', status: 'ONLINE', latency: '42ms', records: '14,820' },
  { source: 'SMMS', name: 'Smart Track Maintenance System', syncTime: '1m ago', status: 'ONLINE', latency: '68ms', records: '8,412' },
  { source: 'TDMS', name: 'Traction Distribution Management', syncTime: '2m ago', status: 'ONLINE', latency: '55ms', records: '3,105' },
  { source: 'BDMS', name: 'Bridge Database Management System', syncTime: '5m ago', status: 'ONLINE', latency: '110ms', records: '1,240' },
  { source: 'COA', name: 'Control Office Application Gateway', syncTime: 'Realtime WebSocket', status: 'ONLINE', latency: '18ms', records: 'Stream Active' },
]

export const AdminPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'users')
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(MOCK_USERS.length)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get<PaginatedResponse<User>>('/users', {
        params: { page, page_size: 10 },
      })
      if (res?.data?.data?.items && res.data.data.items.length > 0) {
        setUsers(res.data.data.items)
        setTotal(res.data.data.pagination?.total || res.data.data.items.length)
      } else {
        setUsers(MOCK_USERS)
        setTotal(MOCK_USERS.length)
      }
    } catch {
      // Graceful fallback to synthetic operational users for standalone/demo Vercel hosting
      setUsers(MOCK_USERS)
      setTotal(MOCK_USERS.length)
      setError(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') {
      loadData()
    }
  }, [activeTab, page])

  const columns: Column<User>[] = [
    { key: 'username', header: 'Username', sortable: true, className: 'font-mono font-bold' },
    { key: 'full_name', header: 'Full Name', sortable: true },
    { key: 'email', header: 'Official Email' },
    {
      key: 'roles',
      header: 'Assigned Role',
      render: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold">
          {item.roles?.[0] || 'VIEWER'}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (item) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
          {item.department?.name || item.department?.code || '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
            item.is_active && !item.is_locked
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {item.is_active && !item.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
          {item.is_locked ? 'LOCKED' : item.is_active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      ),
    },
  ]

  const tabs = [
    { id: 'users', label: 'User Directory' },
    { id: 'roles', label: 'Roles & RBAC' },
    { id: 'departments', label: 'Departments' },
    { id: 'system', label: 'System Configuration' },
    { id: 'data-import', label: 'Data Feeds & Legacy Sync' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Administration"
        subtitle="Manage divisional operators, role privileges, departmental boundaries, and system parameters."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Administration' }, { label: tabs.find(t => t.id === activeTab)?.label || 'Users' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" leftIcon={<UserPlus className="w-3.5 h-3.5" />}>
              Add User
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      {activeTab === 'users' && (
        <Table
          columns={columns}
          data={users}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          emptyMessage="No railway operators found."
          pagination={{
            meta: {
              page,
              page_size: 10,
              total,
              total_pages: Math.ceil(total / 10),
              has_next: page * 10 < total,
              has_prev: page > 1,
            },
            onPageChange: (p) => setPage(p),
          }}
        />
      )}

      {activeTab === 'roles' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Role-Based Access Control (RBAC) Matrix</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">7 Standard Indian Railway Operational Roles</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_ROLES.map((r) => (
              <div key={r.role} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {r.role}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{r.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{r.permissions}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    <strong className="text-slate-900 dark:text-slate-100">{r.users}</strong> active users
                  </span>
                  <span className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px]">
                    ACTIVE
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_DEPARTMENTS.map((dept) => (
            <div key={dept.code} className={`p-5 rounded-xl bg-white dark:bg-slate-900 border-2 ${dept.color} shadow-sm space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{dept.code}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  {dept.activeTasks} Active Tasks
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{dept.name}</h4>
              <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Department Head:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{dept.head}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'system' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Core Engine Configuration</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Dynamic Parameters</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_SYSTEM_CONFIGS.map((cfg) => (
              <div key={cfg.param} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{cfg.param}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                      {cfg.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{cfg.desc}</p>
                </div>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {cfg.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'data-import' && (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Legacy Subsystem Feeds & Data Ingestion</h3>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> All Feeds Operational
            </span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {MOCK_DATA_FEEDS.map((feed) => (
              <div key={feed.source} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {feed.source}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{feed.name}</h4>
                    <p className="text-xs text-slate-500">Last synced: {feed.syncTime} • Records: {feed.records}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-slate-500">{feed.latency}</span>
                  <span className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {feed.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPage
