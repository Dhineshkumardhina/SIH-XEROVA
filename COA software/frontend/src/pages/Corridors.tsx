import React, { useState, useEffect } from 'react'
import { RefreshCw, Zap } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type Column } from '../components/ui/Table'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Button } from '../components/ui/Button'
import { corridorService } from '../services/corridors'
import type { Corridor } from '../types/corridor'

export const CorridorsPage: React.FC = () => {
  const [corridors, setCorridors] = useState<Corridor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const res = await corridorService.getCorridors({ page: 1, page_size: 20 })
      if (res?.data?.items) {
        setCorridors(res.data.items)
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load corridors')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const columns: Column<Corridor>[] = [
    { key: 'code', header: 'Corridor Code', sortable: true, className: 'font-mono font-bold' },
    { key: 'name', header: 'Corridor Name', sortable: true },
    { key: 'distance_km', header: 'Distance', render: (item) => `${item.distance_km} km` },
    { key: 'track_count', header: 'Tracks', render: (item) => `${item.track_count} Line(s)` },
    {
      key: 'electrified',
      header: 'Traction',
      render: (item) =>
        item.electrified ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" /> 25kV OHE
          </span>
        ) : (
          <span className="text-slate-400 text-xs">Diesel</span>
        ),
    },
    { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Railway Corridors"
        subtitle="Operational sections, line configuration, traction status, and corridor availability telemetry."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Operations' }, { label: 'Corridors' }]}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh Corridors
          </Button>
        }
      />

      <Table
        columns={columns}
        data={corridors}
        isLoading={isLoading}
        error={error}
        onRetry={loadData}
        emptyMessage="No railway corridors registered in division."
      />
    </div>
  )
}

export default CorridorsPage
