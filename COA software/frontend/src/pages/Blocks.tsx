import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { blockService } from '../services/blocks'
import type { BlockRequest } from '../types/block'

export const BlocksPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'requests')
  const [requests, setRequests] = useState<BlockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const statusFilter =
        activeTab === 'pending'
          ? 'SUBMITTED'
          : activeTab === 'approved'
          ? 'APPROVED'
          : undefined

      const res = await blockService.getBlockRequests({
        page,
        page_size: 10,
        status: statusFilter,
      })

      if (res?.data?.items) {
        setRequests(res.data.items)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load block requests')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, page])

  const columns: Column<BlockRequest>[] = [
    { 
      key: 'request_code', 
      header: 'Request Code', 
      sortable: true, 
      className: 'font-mono font-bold',
      render: (item) => (
        <Link to={`/blocks/requests/${item.id}`} className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {item.request_code}
        </Link>
      )
    },
    { key: 'department', header: 'Department', render: (item) => <span className="font-mono">{item.department || 'ENG'}</span> },
    { key: 'block_type', header: 'Block Type' },
    { key: 'duration_minutes', header: 'Duration', render: (item) => `${item.duration_minutes} min` },
    {
      key: 'preferred_start_at',
      header: 'Preferred Window',
      render: (item) => (
        <span className="font-mono text-[11px]">
          {new Date(item.preferred_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
          {new Date(item.preferred_end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]

  const tabs = [
    { id: 'requests', label: 'All Block Requests' },
    { id: 'pending', label: 'Pending Approval' },
    { id: 'approved', label: 'Approved Blocks' },
    { id: 'conflicts', label: 'Conflict Analysis' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Block Requests & Planning"
        subtitle="Submit, review, coordinate, and authorize track possession and overhead power shutoff blocks."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Operations' }, { label: 'Blocks' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              New Block Request
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      <Table
        columns={columns}
        data={requests}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No block requests found for this category."
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

export default BlocksPage
