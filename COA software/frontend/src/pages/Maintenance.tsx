import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { maintenanceService } from '../services/maintenance'
import type { MaintenanceTask } from '../types/maintenance'

export const MaintenancePage: React.FC<{ initialFilter?: string }> = ({ initialFilter }) => {
  const [activeTab, setActiveTab] = useState(initialFilter || 'tasks')
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      let res
      if (activeTab === 'overdue') {
        res = await maintenanceService.getOverdueTasks({ page, page_size: 10 })
      } else if (activeTab === 'critical') {
        res = await maintenanceService.getCriticalTasks({ page, page_size: 10 })
      } else {
        res = await maintenanceService.getTasks({ page, page_size: 10 })
      }

      if (res?.data?.items) {
        setTasks(res.data.items)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load maintenance tasks')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, page])

  const columns: Column<MaintenanceTask>[] = [
    { key: 'task_code', header: 'Task Code', sortable: true, className: 'font-mono font-bold' },
    { key: 'description', header: 'Description' },
    { key: 'department', header: 'Department', render: (item) => <span className="font-mono">{item.department || 'ENG'}</span> },
    { key: 'duration_minutes', header: 'Duration', render: (item) => `${item.duration_minutes} min` },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <span
          className={`font-semibold text-xs ${
            item.priority === 'CRITICAL' ? 'text-red-500' : item.priority === 'HIGH' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          {item.priority}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]

  const tabs = [
    { id: 'tasks', label: 'All Tasks' },
    { id: 'overdue', label: 'Overdue Maintenance' },
    { id: 'critical', label: 'Critical Tasks' },
    { id: 'calendar', label: 'Maintenance Calendar' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Task Hub"
        subtitle="Manage scheduled, overdue, and urgent track, signal, and overhead equipment work orders."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Maintenance' }, { label: 'Tasks' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Maintenance Task
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      <Table
        columns={columns}
        data={tasks}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No maintenance tasks found for current view."
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
    </div>
  )
}

export default MaintenancePage
