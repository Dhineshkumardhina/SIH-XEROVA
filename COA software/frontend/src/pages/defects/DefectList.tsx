import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Badge } from '../../components/ui/Badge'
import { defectService } from '../../services/defects'
import { useDebounce } from '../../hooks/useDebounce'
import { formatDate } from '../../shared/utils'

export const DefectList: React.FC = () => {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['defects', { page, search: debouncedSearch, severity: severityFilter, status: statusFilter }],
    queryFn: () => defectService.getDefects({
      page,
      search: debouncedSearch || undefined,
      severity: severityFilter !== 'ALL' ? severityFilter : undefined,
      status: statusFilter !== 'ALL' ? statusFilter : undefined,
    }),
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <Badge variant="danger">Critical</Badge>
      case 'HIGH': return <Badge variant="warning">High</Badge>
      case 'MEDIUM': return <Badge variant="info">Medium</Badge>
      case 'LOW': return <Badge variant="neutral">Low</Badge>
      default: return <Badge variant="neutral">{severity}</Badge>
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'text-red-600 dark:text-red-400 font-bold'
    if (score >= 50) return 'text-orange-500 font-semibold'
    if (score >= 25) return 'text-yellow-600 dark:text-yellow-500'
    return 'text-blue-500'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Defect Tracker"
        subtitle="Operational defect list across all engineering disciplines"
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Defects', href: '/defects' },
          { label: 'List' },
        ]}
        actions={
          <Button variant="primary" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Report Defect
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by defect code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-40"
            options={[
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Open', value: 'OPEN' },
              { label: 'Assigned', value: 'ASSIGNED' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Closed', value: 'CLOSED' },
            ]}
          />
          <Select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-40"
            options={[
              { label: 'All Severities', value: 'ALL' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' },
            ]}
          />
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Defect ID</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Asset / Dept</th>
                <th className="px-6 py-4 font-semibold">Severity</th>
                <th className="px-6 py-4 font-semibold">Risk Score</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Loading defects...
                  </td>
                </tr>
              ) : !data?.data?.items.length ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No defects found matching your criteria.
                  </td>
                </tr>
              ) : (
                data.data.items.map((defect) => (
                  <tr key={defect.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-blue-600 dark:text-blue-400">
                      {defect.defect_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-medium text-slate-900 dark:text-white" title={defect.description}>
                        {defect.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Detected: {formatDate(defect.detected_at || defect.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs">{defect.asset_id.substring(0,8)}...</div>
                      <div className="text-xs text-slate-500 mt-1">{defect.department || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getSeverityBadge(defect.severity)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold ${getRiskColor(defect.risk_score)}`}>
                          {Math.round(defect.risk_score)}
                        </span>
                        {defect.risk_score >= 75 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={defect.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/defects/${defect.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination placeholder */}
        {data && data.data.pagination.total_pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-sm text-slate-500">
            <span>Showing page {page} of {data.data.pagination.total_pages}</span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setPage(p => Math.min(data.data.pagination.total_pages, p + 1))}
                disabled={page === data.data.pagination.total_pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default DefectList
