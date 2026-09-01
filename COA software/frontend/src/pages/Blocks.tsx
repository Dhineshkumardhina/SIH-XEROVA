import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { blockService } from '../services/blocks'
import type { BlockRequest } from '../types/block'
import { CreateBlockRequestModal } from '../components/blocks/CreateBlockRequestModal'
import { BlockConflictPanel } from '../components/blocks/BlockConflictPanel'
import { Card } from '../components/ui/Card'

export const BlocksPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'requests')
  const [requests, setRequests] = useState<BlockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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

  const handleRequestCreated = () => {
    setToastMessage('Block possession request created and queued for safety validation!')
    loadData()
    setTimeout(() => setToastMessage(null), 4000)
  }

  const columns: Column<BlockRequest>[] = [
    { 
      key: 'request_code', 
      header: 'Request Code', 
      sortable: true, 
      className: 'font-mono font-bold',
      render: (item) => (
        <Link to={`/blocks/requests/${item.id}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {item.request_code}
        </Link>
      )
    },
    { key: 'department', header: 'Department', render: (item) => <span className="font-mono font-bold">{item.department || 'ENG'}</span> },
    { key: 'block_type', header: 'Block Type' },
    { key: 'duration_minutes', header: 'Duration', render: (item) => `${item.duration_minutes} min` },
    {
      key: 'preferred_start_at',
      header: 'Preferred Window',
      render: (item) => (
        <span className="font-mono text-[11px]">
          {item.preferred_start_at ? new Date(item.preferred_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'} –{' '}
          {item.preferred_end_at ? new Date(item.preferred_end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Block Request
            </Button>
          </div>
        }
      />

      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      {activeTab === 'conflicts' ? (
        <div className="space-y-4">
          <Card>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Spatial & Temporal Conflict Analysis
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time detection of train timetable crossings, consecutive possession overlaps, and power feeder safety boundaries.
                </p>
              </div>
            </div>
          </Card>
          {requests.length > 0 ? (
            <BlockConflictPanel requestId={requests[0].id} status={requests[0].status} />
          ) : (
            <Card>
              <div className="p-8 text-center text-xs text-slate-500">
                No active block requests available for conflict inspection. Click "New Block Request" to create one.
              </div>
            </Card>
          )}
        </div>
      ) : (
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
      )}

      {/* Interactive Modal for Creating New Block Request */}
      <CreateBlockRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRequestCreated}
      />
    </div>
  )
}

export default BlocksPage
