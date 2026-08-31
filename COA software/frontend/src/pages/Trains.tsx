import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Tabs } from '../components/ui/Tabs'
import { trainService } from '../services/trains'
import type { Train } from '../types/train'

export const TrainsPage: React.FC<{ initialTab?: string }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'all')
  const [trains, setTrains] = useState<Train[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const typeFilter = activeTab === 'all' ? undefined : activeTab.toUpperCase()
      const res = await trainService.getTrains({ page, page_size: 10, train_type: typeFilter })
      if (res?.data?.items) {
        setTrains(res.data.items)
        setTotal(res.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load trains')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [activeTab, page])

  const columns: Column<Train>[] = [
    { key: 'train_number', header: 'Train #', sortable: true, className: 'font-mono font-bold' },
    { key: 'train_name', header: 'Train Name', sortable: true },
    { key: 'train_type', header: 'Type', sortable: true },
    { key: 'origin', header: 'Origin' },
    { key: 'destination', header: 'Destination' },
    { key: 'priority', header: 'Priority', render: (item) => <span className="font-mono">{item.priority}</span> },
  ]

  const tabs = [
    { id: 'all', label: 'All Trains' },
    { id: 'passenger', label: 'Passenger & Express' },
    { id: 'goods', label: 'Freight (Goods)' },
    { id: 'live', label: 'Live Movements' },
    { id: 'forecast', label: 'Freight Forecast' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Train Timetable & Operations"
        subtitle="Manage master train catalog, section run schedules, and real-time corridor movements."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Operations' }, { label: 'Trains' }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Timetable
          </Button>
        }
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => { setActiveTab(id); setPage(1); }} />

      <Table
        columns={columns}
        data={trains}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No trains found for selected category."
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

export default TrainsPage
