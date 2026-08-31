import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { defectService } from '../../services/defects'
import { formatDate } from '../../shared/utils'
import { Badge } from '../../components/ui/Badge'

export const DefectOverdue: React.FC = () => {
  const page = 1 // Simplified for now

  const { data, isLoading } = useQuery({
    queryKey: ['defects', 'overdue', { page }],
    queryFn: () => defectService.getOverdueDefects({ page }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overdue Defects"
        subtitle="Unresolved defects past their target resolution date"
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Defects', href: '/defects' },
          { label: 'Overdue' },
        ]}
      />

      <Card className="border-orange-200 dark:border-orange-900/50">
        <div className="bg-orange-50 dark:bg-orange-900/10 p-4 border-b border-orange-100 dark:border-orange-900/30 flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-orange-900 dark:text-orange-100">SLA Breach Queue</h3>
            <p className="text-sm text-orange-700 dark:text-orange-300">Sorted by oldest target resolution date</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Defect ID</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Asset / Dept</th>
                <th className="px-6 py-4 font-semibold">Target Resolution</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading overdue defects...
                  </td>
                </tr>
              ) : !data?.data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No overdue defects found. SLAs are being met!
                  </td>
                </tr>
              ) : (
                data.data.items.map((defect) => (
                  <tr key={defect.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-900/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-orange-600 dark:text-orange-400">
                      {defect.defect_code}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate font-medium text-slate-900 dark:text-white" title={defect.description}>
                        {defect.description}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Severity: {defect.severity}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs">{defect.asset_id.substring(0,8)}...</div>
                      <div className="text-xs text-slate-500 mt-1">{defect.department || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-red-600 dark:text-red-400">
                        {defect.target_resolution_date ? formatDate(defect.target_resolution_date) : 'N/A'}
                      </div>
                      <Badge variant="danger" className="mt-1 text-[10px]">Overdue</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={defect.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/defects/${defect.id}`}>
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default DefectOverdue
