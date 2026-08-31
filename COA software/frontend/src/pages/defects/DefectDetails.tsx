import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Clock, AlertTriangle, 
  CheckCircle, Play, Check, Server, Wrench
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { defectService } from '../../services/defects'
import { assetService } from '../../services/assets'
import { formatDate } from '../../shared/utils'

export const DefectDetails: React.FC = () => {
  const { defectId } = useParams<{ defectId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [resolutionNotes, setResolutionNotes] = useState('')

  const { data: defectData, isLoading: defectLoading } = useQuery({
    queryKey: ['defect', defectId],
    queryFn: () => defectService.getDefectById(defectId!),
    enabled: !!defectId,
  })

  const defect = defectData?.data

  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ['asset', defect?.asset_id],
    queryFn: () => assetService.getAssetById(defect!.asset_id),
    enabled: !!defect?.asset_id,
  })
  
  const asset = assetData?.data

  const startMutation = useMutation({
    mutationFn: () => defectService.startResolution(defectId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defect', defectId] }),
  })

  const resolveMutation = useMutation({
    mutationFn: () => defectService.resolveDefect(defectId!, resolutionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', defectId] })
      setResolutionNotes('')
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => defectService.closeDefect(defectId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defect', defectId] }),
  })

  if (defectLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-96 rounded-xl" /></div>
  }

  if (!defect) {
    return <div className="p-8 text-center text-slate-500">Defect not found.</div>
  }

  const getRiskLevel = (score: number) => {
    if (score >= 75) return { label: 'CRITICAL', color: 'bg-red-500' }
    if (score >= 50) return { label: 'HIGH', color: 'bg-orange-500' }
    if (score >= 25) return { label: 'MEDIUM', color: 'bg-yellow-500' }
    return { label: 'LOW', color: 'bg-blue-500' }
  }

  const riskLevel = getRiskLevel(defect.risk_score)
  const isOverdue = defect.target_resolution_date && new Date(defect.target_resolution_date) < new Date() && !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(defect.status)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{defect.defect_code}</h1>
            <StatusBadge status={defect.status} />
            {isOverdue && <Badge variant="danger">Overdue</Badge>}
          </div>
          <p className="text-slate-500 max-w-2xl">{defect.description}</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {['OPEN', 'ASSIGNED', 'SCHEDULED'].includes(defect.status) && (
            <Button 
              variant="primary" 
              onClick={() => startMutation.mutate()} 
              disabled={startMutation.isPending}
              className="gap-2"
            >
              <Play className="w-4 h-4" /> Start Resolution
            </Button>
          )}
          
          {defect.status === 'IN_PROGRESS' && (
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="Resolution notes..." 
                className="text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
              />
              <Button 
                variant="success" 
                onClick={() => resolveMutation.mutate()} 
                disabled={resolveMutation.isPending || !resolutionNotes}
                className="gap-2"
              >
                <Check className="w-4 h-4" /> Resolve
              </Button>
            </div>
          )}

          {defect.status === 'RESOLVED' && (
            <Button 
              variant="outline" 
              onClick={() => closeMutation.mutate()} 
              disabled={closeMutation.isPending}
              className="gap-2 border-slate-700 text-slate-700 dark:border-slate-300 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <CheckCircle className="w-4 h-4" /> Close Defect
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-slate-400" />
                Risk Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-8 border-slate-100 dark:border-slate-800">
                    <div className="absolute inset-0 rounded-full border-8 border-transparent"
                         style={{ borderTopColor: riskLevel.color.replace('bg-', ''), transform: `rotate(${defect.risk_score * 3.6}deg)` }}>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(defect.risk_score)}</span>
                      <span className="text-xs block text-slate-500">/ 100</span>
                    </div>
                  </div>
                  <Badge className={`${riskLevel.color} text-white border-none`}>{riskLevel.label} RISK</Badge>
                  <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Baseline Risk Model</p>
                </div>

                <div className="flex-1 w-full space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Why this risk?</h4>
                    <p className="text-xs text-slate-500 mb-4">The calculated risk score is a transparent weighted combination of severity, asset criticality, and impact variables.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Severity</span>
                        <span className="font-semibold">{defect.severity}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full ${riskLevel.color}`} style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Safety Impact</span>
                        <span className="font-semibold">{defect.safety_impact}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${defect.safety_impact}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Operational Impact</span>
                        <span className="font-semibold">{defect.operational_impact}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${defect.operational_impact}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Asset Health</span>
                        <span className="font-semibold">{asset ? `${Math.round(asset.health_score)}/100` : 'N/A'}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${asset?.health_score || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Lifecycle Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1"></div>
                    <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1"></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">Detected</h4>
                    <p className="text-xs text-slate-500">{formatDate(defect.detected_at || defect.created_at)} by {defect.detected_by || 'System'}</p>
                  </div>
                </div>

                {defect.target_resolution_date && (
                  <div className="flex gap-4">
                    <div className="w-8 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1"></div>
                      <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-700 my-1"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Target Resolution</h4>
                      <p className="text-xs text-slate-500">{formatDate(defect.target_resolution_date)}</p>
                    </div>
                  </div>
                )}

                {defect.resolved_at && (
                  <div className="flex gap-4">
                    <div className="w-8 flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">Resolved</h4>
                      <p className="text-xs text-slate-500">{formatDate(defect.resolved_at)}</p>
                      {defect.resolution_notes && (
                        <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm italic border border-slate-200 dark:border-slate-700">
                          "{defect.resolution_notes}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-slate-400" />
                Asset Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assetLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : !asset ? (
                <p className="text-sm text-slate-500">Asset information not found.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold mb-1">Asset Code</p>
                    <p className="font-mono text-sm">{asset.asset_code}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">Type</p>
                      <p className="text-sm capitalize">{asset.asset_type ? asset.asset_type.toLowerCase().replace('_', ' ') : 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold mb-1">Health</p>
                      <p className="text-sm">{Math.round(asset.health_score)}/100</p>
                    </div>
                  </div>
                  <Link to={`/assets/${asset.id}`} className="block w-full">
                    <Button variant="outline" className="w-full text-xs py-1.5 h-auto">View Asset</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-400" />
                Maintenance Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                <p className="text-xs text-slate-500 mb-3">No maintenance task currently linked.</p>
                <Link to="/maintenance/list">
                  <Button variant="outline" size="sm" className="w-full text-xs">Browse Maintenance</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DefectDetails
