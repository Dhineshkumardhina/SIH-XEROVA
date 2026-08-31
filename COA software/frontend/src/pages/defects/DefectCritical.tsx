import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ShieldAlert, AlertTriangle } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { defectService } from '../../services/defects'
import { formatDate } from '../../shared/utils'

export const DefectCritical: React.FC = () => {
  const page = 1 // Simplified for now

  const { data, isLoading } = useQuery({
    queryKey: ['defects', 'critical', { page }],
    queryFn: () => defectService.getCriticalDefects({ page }),
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Critical Defects"
        subtitle="High-risk defects requiring immediate attention"
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Defects', href: '/defects' },
          { label: 'Critical' },
        ]}
      />

      <Card className="border-red-200 dark:border-red-900/50">
        <div className="bg-red-50 dark:bg-red-900/10 p-4 border-b border-red-100 dark:border-red-900/30 flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Critical Priority Queue</h3>
            <p className="text-sm text-red-700 dark:text-red-300">Sorted by risk score and overdue status</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 uppercase border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Defect ID</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Asset / Dept</th>
                <th className="px-6 py-4 font-semibold">Risk Score</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading critical defects...
                  </td>
                </tr>
              ) : !data?.data?.items.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No critical defects found. All clear.
                  </td>
                </tr>
              ) : (
                data.data.items.map((defect) => (
                  <tr key={defect.id} className="hover:bg-red-50/50 dark:hover:bg-red-900/5 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-red-600 dark:text-red-400">
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
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-red-600 dark:text-red-400 text-lg">
                          {Math.round(defect.risk_score)}
                        </span>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={defect.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/defects/${defect.id}`}>
                        <Button variant="danger" size="sm">Review</Button>
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

export default DefectCritical
