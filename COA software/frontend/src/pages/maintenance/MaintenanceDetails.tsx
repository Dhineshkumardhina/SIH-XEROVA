import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowLeft, Shield, Clock, AlertTriangle, 
  Play, CheckCircle, XCircle, FileText, Server
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { maintenanceService } from '../../services/maintenance'
import { formatDateTime, priorityColor } from '../../shared/utils'
import { useAuthStore } from '../../store/authStore'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Toast } from '../../components/ui/Toast'

export const MaintenanceDetails: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { hasPermission } = useAuthStore()
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance', 'task', taskId],
    queryFn: () => maintenanceService.getTaskById(taskId!),
    enabled: !!taskId,
  })

  const task = data?.data

  // Mutations
  const startMutation = useMutation({
    mutationFn: () => maintenanceService.startTask(taskId!),
    onSuccess: () => {
      setToast({ message: 'Task started successfully.', type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.error?.message || 'Failed to start task.', type: 'error' })
    }
  })

  const completeMutation = useMutation({
    mutationFn: () => maintenanceService.completeTask(taskId!, { completion_notes: 'Completed via Command Center' }),
    onSuccess: () => {
      setToast({ message: 'Task marked as complete.', type: 'success' })
      setShowCompleteDialog(false)
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.error?.message || 'Failed to complete task.', type: 'error' })
      setShowCompleteDialog(false)
    }
  })

  const cancelMutation = useMutation({
    mutationFn: () => maintenanceService.cancelTask(taskId!, { cancellation_reason: 'Cancelled via Command Center' }),
    onSuccess: () => {
      setToast({ message: 'Task cancelled.', type: 'success' })
      setShowCancelDialog(false)
      queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    },
    onError: (err: any) => {
      setToast({ message: err?.response?.data?.error?.message || 'Failed to cancel task.', type: 'error' })
      setShowCancelDialog(false)
    }
  })

  const canUpdate = hasPermission('MAINTENANCE_UPDATE')
  const canComplete = hasPermission('MAINTENANCE_COMPLETE')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-bold">Failed to load task</h2>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Task not found.'}</p>
        <Button className="mt-4" onClick={() => navigate('/maintenance/tasks')}>Back to List</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      {toast && (
        <Toast 
          toast={{ id: 't1', type: toast.type, title: toast.message }}
          onDismiss={() => setToast(null)} 
        />
      )}

      {/* Action Dialogs */}
      <ConfirmDialog
        isOpen={showCompleteDialog}
        title="Complete Maintenance Task"
        message={`Are you sure you want to mark ${task.task_code} as COMPLETED? This will update the asset's health record and release any active blocks.`}
        confirmText="Confirm Completion"
        cancelText="Cancel"
        onConfirm={() => completeMutation.mutate()}
        onClose={() => setShowCompleteDialog(false)}
        variant="primary"
      />

      <ConfirmDialog
        isOpen={showCancelDialog}
        title="Cancel Maintenance Task"
        message={`Are you sure you want to cancel ${task.task_code}? This action cannot be undone.`}
        confirmText="Cancel Task"
        cancelText="Keep Task"
        onConfirm={() => cancelMutation.mutate()}
        onClose={() => setShowCancelDialog(false)}
        variant="danger"
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button 
            onClick={() => navigate('/maintenance/tasks')}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tasks
          </button>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{task.task_code}</h1>
            <StatusBadge status={task.status} />
            <Badge className={priorityColor(task.priority)}>{task.priority}</Badge>
          </div>
          <p className="text-sm text-slate-500 max-w-3xl">{task.description}</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {(task.status === 'PLANNED' || task.status === 'PENDING') && canUpdate && (
            <Button 
              variant="primary" 
              leftIcon={<Play className="w-4 h-4" />}
              isLoading={startMutation.isPending}
              onClick={() => startMutation.mutate()}
            >
              Start Task
            </Button>
          )}
          
          {task.status === 'IN_PROGRESS' && canComplete && (
            <Button 
              variant="primary" 
              className="bg-emerald-600 hover:bg-emerald-700"
              leftIcon={<CheckCircle className="w-4 h-4" />}
              onClick={() => setShowCompleteDialog(true)}
            >
              Complete Task
            </Button>
          )}

          {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && canUpdate && (
            <Button 
              variant="danger" 
              leftIcon={<XCircle className="w-4 h-4" />}
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Details (Col 1+2) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <CardTitle>Task Specification</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Task Type</p>
                  <p className="text-sm font-bold">{task.task_type || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Department</p>
                  <p className="text-sm font-bold font-mono">{task.department || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Duration</p>
                  <p className="text-sm font-bold">{task.duration_minutes} mins</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Assigned Team</p>
                  <p className="text-sm font-bold">{(task as any).assigned_team || 'Unassigned'}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Urgency</p>
                  <p className="text-sm font-bold">{task.urgency ?? 50}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Safety Impact</p>
                  <p className="text-sm font-bold">{task.safety_impact ?? 50}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1">Train Impact</p>
                  <p className="text-sm font-bold">{task.train_impact ?? 10}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <CardTitle>Schedule & Operations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Scheduled Start</p>
                    <p className="text-sm font-bold">{formatDateTime(task.scheduled_start_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-1">Due Date</p>
                    <p className={`text-sm font-bold ${task.is_overdue ? 'text-red-500' : ''}`}>
                      {formatDateTime(task.due_at)}
                      {task.is_overdue && <span className="ml-2 text-xs text-red-500 uppercase">(Overdue)</span>}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold">Block Required</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Line possession needed</p>
                    </div>
                    {task.block_required ? (
                      <Badge variant="purple">YES</Badge>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">NO</span>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold">Isolation Required</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">OHE power isolation</p>
                    </div>
                    {task.isolation_required ? (
                      <Badge variant="danger">YES</Badge>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">NO</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Col 3) */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-indigo-500" />
                  <CardTitle>Asset Connection</CardTitle>
                </div>
                <Badge variant="info" size="sm">LINKED</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Target Asset ID</p>
                <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">
                  {task.asset_id}
                </p>
              </div>
              
              <Link to={`/assets/${task.asset_id}`} className="block">
                <Button variant="outline" className="w-full text-xs" rightIcon={<ArrowLeft className="w-3 h-3 rotate-180" />}>
                  View Full Asset Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <CardTitle>Source System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-500">Origin</span>
                <Badge variant="neutral" className="font-mono">
                  {(task as any).external_source || 'MANUAL'}
                </Badge>
              </div>
              {(task as any).external_id && (
                <div className="mt-2 text-right">
                  <span className="text-[10px] text-slate-400 font-mono">Ref: {(task as any).external_id}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default MaintenanceDetails
