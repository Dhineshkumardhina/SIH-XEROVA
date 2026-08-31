import React, { useState, useEffect } from 'react'
import { UserPlus, RefreshCw, Lock, Unlock } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import api from '../services/api'
import type { User } from '../types/user'
import type { PaginatedResponse } from '../types/common'

export const AdminPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'users')
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await api.get<PaginatedResponse<User>>('/users', {
        params: { page, page_size: 10 },
      })
      if (res?.data?.data?.items) {
        setUsers(res.data.data.items)
        setTotal(res.data.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load users')
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
        <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
          {item.roles?.[0] || 'VIEWER'}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      render: (item) => <span className="font-mono">{item.department?.code || '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${
            item.is_active && !item.is_locked ? 'text-emerald-500' : 'text-red-500'
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
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Administration' }, { label: 'Users' }]}
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

      {activeTab === 'users' ? (
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
      ) : (
        <div className="p-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Configured via Phase 5 FastAPI backends. Role permissions and department seed matrices are active in database.
          </p>
        </div>
      )}
    </div>
  )
}

export default AdminPage
