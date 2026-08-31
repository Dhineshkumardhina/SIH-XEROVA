import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, Clock, RefreshCw, FileText } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Card } from '../../components/ui/Card'
import { blockService } from '../../services/blocks'
import { trainImpactService } from '../../services/trainImpact'
import type { BlockRequest } from '../../types/block'
import type { MaintenanceTask } from '../../types/maintenance'
import type { TrainImpactData, AlternativeWindow } from '../../types/trainImpact'
import { BlockConflictPanel } from '../../components/blocks/BlockConflictPanel'
import { TrainImpactPanel } from '../../components/planner/TrainImpactPanel'

export const BlockRequestDetail: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>()
  const navigate = useNavigate()
  
  const [request, setRequest] = useState<BlockRequest | null>(null)
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [impactData, setImpactData] = useState<TrainImpactData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    if (!requestId) return
    try {
      setIsLoading(true)
      const res = await blockService.getBlockRequestById(requestId)
      setRequest(res.data)
      
      const tasksRes = await blockService.getBlockRequestTasks(requestId)
      setTasks(tasksRes.data)

      // Fetch or calculate train impact for this block window
      try {
        const impactRes = await trainImpactService.calculateBlockRequestImpact(requestId)
        setImpactData(impactRes.data)
      } catch (e) {
        console.warn('Could not load block request impact', e)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load block request details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [requestId])

  const handleApplyAlternative = async (alt: AlternativeWindow) => {
    if (!request?.id) return
    if (!confirm(`Switch possession window to recommended slot ${alt.start_time}–${alt.end_time}?`)) return
    try {
      setActionLoading(true)
      await blockService.updateBlockRequest(request.id, {
        preferred_start_at: alt.start_datetime,
        preferred_end_at: alt.end_datetime,
        duration_minutes: alt.duration_minutes
      })
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to update window')
    } finally {
      setActionLoading(false)
    }
  }

  const handleValidate = async () => {
    if (!request?.id) return
    try {
      setActionLoading(true)
      await blockService.validateBlockRequest(request.id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Validation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!request?.id) return
    if (!confirm('Are you sure you want to approve this block request?')) return
    try {
      setActionLoading(true)
      await blockService.approveBlockRequest(request.id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Approval failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!request?.id) return
    const reason = prompt('Enter rejection reason:')
    if (!reason) return
    try {
      setActionLoading(true)
      await blockService.rejectBlockRequest(request.id, reason)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Rejection failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!request?.id) return
    if (!confirm('Mark this block as completed?')) return
    try {
      setActionLoading(true)
      await blockService.completeBlockRequest(request.id)
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Completion failed')
    } finally {
      setActionLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center"><RefreshCw className="animate-spin text-slate-400" /></div>
  }

  if (error || !request) {
    return <div className="p-8 text-red-400 text-center">{error || 'Not found'}</div>
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={`Block Request: ${request.request_code}`}
        subtitle="Review, analyze conflicts, and manage lifecycle of this track block request."
        breadcrumbs={[
          { label: 'Blocks', href: '/blocks' },
          { label: request.request_code }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            {request.status === 'DRAFT' && (
              <Button variant="primary" onClick={handleValidate} isLoading={actionLoading}>
                Submit Request
              </Button>
            )}
            {request.status === 'SUBMITTED' && (
              <Button variant="primary" onClick={handleValidate} isLoading={actionLoading} leftIcon={<RefreshCw className="w-4 h-4" />}>
                Validate & Check Conflicts
              </Button>
            )}
            {request.status === 'VALIDATED' && (
              <>
                <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" onClick={handleReject} isLoading={actionLoading} leftIcon={<XCircle className="w-4 h-4" />}>
                  Reject
                </Button>
                <Button variant="primary" className="bg-green-600 hover:bg-green-500 text-white" onClick={handleApprove} isLoading={actionLoading} leftIcon={<CheckCircle className="w-4 h-4" />}>
                  Approve Block
                </Button>
              </>
            )}
            {request.status === 'APPROVED' && (
              <Button variant="primary" onClick={handleComplete} isLoading={actionLoading} leftIcon={<CheckCircle className="w-4 h-4" />}>
                Mark Completed
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-100">Request Details</h2>
                <StatusBadge status={request.status} />
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Department</label>
                  <p className="text-sm text-slate-200 font-mono">{request.department || 'ENG'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Block Type</label>
                  <p className="text-sm text-slate-200">{request.block_type}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Priority</label>
                  <p className="text-sm text-slate-200">{request.priority}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Isolation Required</label>
                  <p className="text-sm text-slate-200">{request.isolation_required ? 'Yes' : 'No'}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-400 mb-1">Reason</label>
                  <p className="text-sm text-slate-200">{request.reason}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-700/50 bg-slate-800/30 p-6">
              <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Window Specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Duration</label>
                  <p className="text-sm text-slate-200">{request.duration_minutes} min</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Preferred Start</label>
                  <p className="text-sm text-slate-200 font-mono">
                    {new Date(request.preferred_start_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Preferred End</label>
                  <p className="text-sm text-slate-200 font-mono">
                    {new Date(request.preferred_end_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Associated Tasks
              </h2>
              {tasks.length === 0 ? (
                <p className="text-sm text-slate-400">No maintenance tasks linked to this request.</p>
              ) : (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-700/50 bg-slate-800/30">
                      <div>
                        <p className="text-sm font-medium text-slate-200">{task.task_code}</p>
                        <p className="text-xs text-slate-400">{task.description}</p>
                      </div>
                      <StatusBadge status={task.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <BlockConflictPanel requestId={request.id!} status={request.status} />
        </div>
      </div>

      {/* ── Operational Train Impact Analysis & Alternatives ─────────── */}
      {impactData && (
        <div className="pt-4">
          <TrainImpactPanel
            data={impactData}
            onSelectAlternative={request.status === 'DRAFT' || request.status === 'SUBMITTED' || request.status === 'VALIDATED' ? handleApplyAlternative : undefined}
            isLoading={actionLoading}
          />
        </div>
      )}
    </div>
  )
}

export default BlockRequestDetail
