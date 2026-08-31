import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { defectService } from '../services/defects'
import type { Defect } from '../types/defect'

export const DefectsPage: React.FC = () => {
  const [defects, setDefects] = useState<Defect[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await defectService.getDefects({ page, page_size: 10 })
      if (res?.data?.items) {
        setDefects(res.data.items)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load defects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page])

  const columns: Column<Defect>[] = [
    { key: 'defect_code', header: 'Defect Code', sortable: true, className: 'font-mono font-bold text-red-500' },
    { key: 'description', header: 'Description' },
    { key: 'department', header: 'Department', render: (item) => <span className="font-mono">{item.department || 'ENG'}</span> },
    {
      key: 'severity',
      header: 'Severity',
      render: (item) => (
        <span
          className={`font-semibold text-xs ${
            item.severity === 'CRITICAL' ? 'text-red-500' : item.severity === 'HIGH' ? 'text-amber-500' : 'text-slate-400'
          }`}
        >
          {item.severity}
        </span>
      ),
    },
    { key: 'risk_score', header: 'Risk Score', render: (item) => <span className="font-mono">{item.risk_score}</span> },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Defect Tracker"
        subtitle="Track railway asset flaws detected via automated inspection, ultrasonic flaw detection (USFD), and manual reporting."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Maintenance' }, { label: 'Defects' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="danger" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Report Defect
            </Button>
          </div>
        }
      />

      <Table
        columns={columns}
        data={defects}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No open defects recorded."
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

export default DefectsPage
