import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { auditService } from '../services/audit'
import type { AuditLog } from '../types/audit'

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await auditService.getAuditLogs({ page, page_size: 15 })
      if (res?.data?.items) {
        setLogs(res.data.items)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page])

  const columns: Column<AuditLog>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      sortable: true,
      className: 'font-mono text-[11px] whitespace-nowrap',
      render: (item) => new Date(item.created_at).toLocaleString(),
    },
    { key: 'username', header: 'Operator', className: 'font-semibold' },
    { key: 'action', header: 'Action', className: 'font-mono text-xs uppercase text-blue-500 font-bold' },
    { key: 'entity_type', header: 'Target Entity', render: (item) => `${item.entity_type} (#${item.entity_id.slice(0, 8)})` },
    { key: 'description', header: 'Details', render: (item) => item.description || 'System event recorded' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Operational Audit Trail"
        subtitle="Cryptographically verified logging of administrative actions, block authorizations, and asset mutations."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Administration', href: '/admin' }, { label: 'Audit' }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Audit Trail
          </Button>
        }
      />

      <Table
        columns={columns}
        data={logs}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No audit log entries recorded."
        pagination={{
          meta: {
            page,
            page_size: 15,
            total,
            total_pages: Math.ceil(total / 15),
            has_next: page * 15 < total,
            has_prev: page > 1,
          },
          onPageChange: (p) => setPage(p),
        }}
      />
    </div>
  )
}

export default AuditPage
