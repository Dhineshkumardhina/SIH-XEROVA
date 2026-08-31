import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Table, type Column } from '../../components/ui/Table'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { maintenanceService } from '../../services/maintenance'
import type { MaintenanceTask } from '../../types/maintenance'

export const MaintenanceCritical: React.FC = () => {
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['maintenance', 'critical', { page, page_size: 15 }],
    queryFn: () => maintenanceService.getCriticalTasks({ page, page_size: 15 }),
  })

  const columns: Column<MaintenanceTask>[] = [
    { key: 'task_code', header: 'Task ID', className: 'font-mono font-bold text-xs' },
    { key: 'description', header: 'Description', render: (item) => <div className="max-w-xs truncate">{item.description}</div> },
    { key: 'department', header: 'Dept', render: (item) => <span className="font-mono text-xs text-slate-500">{item.department || '—'}</span> },
    {
      key: 'safety_impact',
      header: 'Safety Impact',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div 
              className={`h-full ${item.safety_impact! >= 75 ? 'bg-red-500' : 'bg-amber-500'}`} 
              style={{ width: `${item.safety_impact}%` }} 
            />
          </div>
          <span className="text-[10px] font-mono">{item.safety_impact}%</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Op. Priority',
      render: (item) => (
        <Badge variant={item.priority === 'CRITICAL' ? 'danger' : 'warning'} size="sm" dot>
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
              Action
            </Button>
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Maintenance"
        subtitle="Tasks with CRITICAL operational priority or high safety impact (>75%)."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Maintenance', href: '/maintenance' },
          { label: 'Critical Tasks' },
        ]}
      />

      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400">Criticality Engine</h4>
          <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1">
            Note: <strong>Operational Priority</strong> is assigned by the maintenance department. The AI Priority Engine will evaluate these tasks during Phase 12 block planning to determine scheduling urgency.
          </p>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data?.items || []}
        isLoading={isLoading}
        error={error instanceof Error ? error.message : null}
        onRetry={() => refetch()}
        emptyMessage="No critical maintenance tasks found. Safety systems nominal."
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

export default MaintenanceCritical
