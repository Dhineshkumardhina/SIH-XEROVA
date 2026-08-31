import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, RefreshCw, Eye, BrainCircuit } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, type Column } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { SearchInput } from '../../components/ui/SearchInput'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { maintenanceService } from '../../services/maintenance'
import { priorityColor } from '../../shared/utils'
import type { MaintenanceTask } from '../../types/maintenance'
import { useAuthStore } from '../../store/authStore'

export const MaintenanceList: React.FC = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  const { hasPermission } = useAuthStore()
  const canCreate = hasPermission('MAINTENANCE_CREATE')

  const queryParams: any = { page, page_size: 15 }
  if (search) queryParams.search = search
  if (statusFilter !== 'ALL') queryParams.status = statusFilter
  if (priorityFilter !== 'ALL') queryParams.priority = priorityFilter

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance', 'tasks', queryParams],
    queryFn: () => maintenanceService.getTasks(queryParams),
  })

  // Debounce search
  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, priorityFilter])

  const columns: Column<MaintenanceTask>[] = [
    { key: 'task_code', header: 'Task ID', sortable: true, className: 'font-mono font-bold text-xs', render: (item) => item.task_code },
    { key: 'description', header: 'Description', render: (item) => <div className="max-w-xs truncate" title={item.description}>{item.description}</div> },
    { key: 'department', header: 'Dept', render: (item) => <span className="font-mono text-xs text-slate-500">{item.department || '—'}</span> },
    { key: 'task_type', header: 'Type', render: (item) => <span className="text-xs">{item.task_type}</span> },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <Badge className={priorityColor(item.priority)} size="sm" dot>
          {item.priority}
        </Badge>
      ),
    },
    { key: 'duration_minutes', header: 'Duration', render: (item) => <span className="text-xs">{item.duration_minutes}m</span> },
    {
      key: 'block_required',
      header: 'Block',
      render: (item) => item.block_required ? <Badge variant="purple" size="sm">YES</Badge> : <span className="text-xs text-slate-400">NO</span>
    },
    {
      key: 'ai_priority',
      header: 'AI Priority',
      render: (item) => (
        <Link to={`/ai/priority/${item.id}`} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs">
          <BrainCircuit className="w-3.5 h-3.5" />
          Analyze
        </Link>
      )
    },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Link to={`/maintenance/tasks/${item.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Tasks"
        subtitle="Comprehensive list of all track, signal, and overhead equipment work orders."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Maintenance', href: '/maintenance' },
          { label: 'Tasks' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            {canCreate && (
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                New Task
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="w-full md:w-72">
          <SearchInput
            placeholder="Search by ID or description..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div className="flex gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Planned', value: 'PLANNED' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Overdue', value: 'OVERDUE' },
              { label: 'Completed', value: 'COMPLETED' },
            ]}
          />
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-40"
            options={[
              { label: 'All Priorities', value: 'ALL' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data?.items || []}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : null}
        onRetry={() => refetch()}
        emptyMessage="No maintenance tasks found matching criteria."
        pagination={{
          meta: data?.data?.pagination || {
            page: 1,
            page_size: 15,
            total: 0,
            total_pages: 1,
            has_next: false,
            has_prev: false,
          },
          onPageChange: setPage,
        }}
      />
    </div>
  )
}

export default MaintenanceList
