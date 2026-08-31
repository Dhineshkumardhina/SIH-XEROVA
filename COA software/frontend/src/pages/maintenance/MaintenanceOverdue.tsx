import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Clock, AlertCircle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, type Column } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { maintenanceService } from '../../services/maintenance'
import { priorityColor } from '../../shared/utils'
import type { MaintenanceTask } from '../../types/maintenance'

export const MaintenanceOverdue: React.FC = () => {
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance', 'overdue', { page, page_size: 15 }],
    queryFn: () => maintenanceService.getOverdueTasks({ page, page_size: 15 }),
  })

  const columns: Column<MaintenanceTask>[] = [
    { key: 'task_code', header: 'Task ID', className: 'font-mono font-bold text-xs' },
    { key: 'description', header: 'Description', render: (item) => <div className="max-w-xs truncate">{item.description}</div> },
    { key: 'department', header: 'Dept', render: (item) => <span className="font-mono text-xs text-slate-500">{item.department || '—'}</span> },
    {
      key: 'due_at',
      header: 'Due Date',
      render: (item) => (
        <span className="text-xs text-slate-600 dark:text-slate-400">
          {item.due_at ? new Date(item.due_at).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      key: 'overdue_days',
      header: 'Overdue By',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold text-xs">
          <Clock className="w-3 h-3" />
          <span>{item.overdue_days || 0} days</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => (
        <Badge className={priorityColor(item.priority)} size="sm" dot>
          {item.priority}
        </Badge>
      ),
    },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Link to={`/maintenance/tasks/${item.id}`}>
            <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
              Resolve
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overdue Maintenance"
        subtitle="Tasks that have exceeded their scheduled due date. High priority items must be addressed immediately."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Maintenance', href: '/maintenance' },
          { label: 'Overdue' },
        ]}
      />

      <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Overdue Risk Warning</h4>
          <p className="text-xs text-red-600 dark:text-red-500/80 mt-1">
            Overdue tasks increase the risk of asset failure. Tasks listed here are automatically flagged to the AI Priority Engine for immediate scheduling.
          </p>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data?.items || []}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : null}
        onRetry={() => refetch()}
        emptyMessage="No overdue maintenance tasks. All operations are on schedule."
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

export default MaintenanceOverdue
