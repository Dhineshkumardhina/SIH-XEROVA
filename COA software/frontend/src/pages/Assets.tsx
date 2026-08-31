import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Download, RefreshCw, Activity } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { assetService } from '../services/assets'
import type { Asset } from '../types/asset'

export const AssetsPage: React.FC<{ subType?: string }> = ({ subType }) => {
  const [activeTab, setActiveTab] = useState(subType || 'all')
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const deptFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase()
      const res = await assetService.getAssets({
        page,
        page_size: 10,
        department: deptFilter,
      })
      if (res?.data?.items) {
        setAssets(res.data.items)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load assets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, page])

  const columns: Column<Asset>[] = [
    {
      key: 'asset_code',
      header: 'Asset Code',
      sortable: true,
      className: 'font-mono font-bold',
      render: (item) => (
        <Link to={`/assets/${item.id}`} className="text-blue-400 hover:text-blue-300 hover:underline">
          {item.asset_code}
        </Link>
      )
    },
    {
      key: 'name',
      header: 'Asset Name',
      sortable: true,
      render: (item) => (
        <Link to={`/assets/${item.id}`} className="text-slate-200 hover:text-white hover:underline font-medium">
          {item.name}
        </Link>
      )
    },
    { key: 'asset_type', header: 'Type', sortable: true },
    { key: 'department', header: 'Department', render: (item) => <span className="font-mono">{item.department || 'ENG'}</span> },
    {
      key: 'health_score',
      header: 'Health',
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full ${item.health_score > 70 ? 'bg-emerald-500' : item.health_score > 40 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${item.health_score}%` }}
            />
          </div>
          <span className="font-mono text-xs">{item.health_score}%</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'AI Risk',
      render: (item) => (
        <Link to={`/assets/${item.id}`} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium">
          <Activity className="w-3.5 h-3.5" />
          Risk Profile
        </Link>
      )
    },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]

  const tabs = [
    { id: 'all', label: 'All Infrastructure' },
    { id: 'tracks', label: 'Track Assets' },
    { id: 'signals', label: 'Signaling & Interlocking' },
    { id: 'telecom', label: 'Telecom & OFC' },
    { id: 'ohe', label: 'Traction (OHE)' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Infrastructure Management"
        subtitle="Monitor railway infrastructure health scores, telemetry condition, and maintenance readiness."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Maintenance' }, { label: 'Assets' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" leftIcon={<Download className="w-3.5 h-3.5" />}>
              Export
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Asset
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      <Table
        columns={columns}
        data={assets}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No railway infrastructure assets match current filter."
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

export default AssetsPage
