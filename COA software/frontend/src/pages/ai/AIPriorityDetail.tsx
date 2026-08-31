import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, BrainCircuit, Info, Database } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { aiPriorityService } from '../../services/aiPriority'
import type { AIPriorityPrediction } from '../../types/ai_priority'

export const AIPriorityDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  
  const [prediction, setPrediction] = useState<AIPriorityPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!taskId) return
      try {
        setIsLoading(true)
        // For simplicity, we just fetch one or fetch all and find it
        // If we had a specific GET /ai/priority/{taskId} we would use it.
        // We'll calculate it to ensure we have it if it doesn't exist.
        const res = await aiPriorityService.calculatePriority(taskId)
        setPrediction(res)
      } catch (err: any) {
        setError(err.message || 'Failed to load AI priority analysis')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [taskId])

  if (isLoading) {
    return <div className="p-8 text-center text-slate-400">Loading AI analysis...</div>
  }

  if (error || !prediction) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-400 font-semibold">{error || 'Task not found'}</div>
        <Button variant="outline" onClick={() => navigate('/ai/priority')}>
          Return to AI Priority Queue
        </Button>
      </div>
    )
  }

  const factorEntries = Object.entries(prediction.factor_breakdown || {})
    .sort(([, a], [, b]) => (b?.contribution ?? 0) - (a?.contribution ?? 0))

  const highContrib = factorEntries.filter(([, f]) => (f?.contribution ?? 0) >= 15)
  const medContrib = factorEntries.filter(([, f]) => (f?.contribution ?? 0) >= 5 && (f?.contribution ?? 0) < 15)
  const lowContrib = factorEntries.filter(([, f]) => (f?.contribution ?? 0) < 5)

  const priorityScoreNum = Number(prediction.priority_score) || 0

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={`AI Priority Analysis`}
        subtitle={`Detailed explainability for maintenance task ${prediction.task_id || taskId}`}
        breadcrumbs={[
          { label: 'AI Priority', href: '/ai/priority' },
          { label: prediction.task_id || taskId || 'Detail' }
        ]}
        actions={
          <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 text-center">
            <h3 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-wider">AI Priority Score</h3>
            <div className="text-6xl font-black font-mono tracking-tight text-white mb-4">
              {priorityScoreNum.toFixed(1)} <span className="text-2xl text-slate-500">/ 100</span>
            </div>
            <div className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
              prediction.priority_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30' :
              prediction.priority_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/30' :
              prediction.priority_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/30' :
              'bg-blue-500/20 text-blue-400 border-2 border-blue-500/30'
            }`}>
              {prediction.priority_level || 'NORMAL'}
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                Factor Breakdown
              </h3>
            </div>
            <div className="p-6">
              {factorEntries.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No factor breakdown available for this task.</p>
              ) : (
                <div className="space-y-4">
                  {factorEntries.map(([key, factor]) => {
                    const contrib = Number(factor?.contribution) || 0
                    const weight = Number(factor?.weight) || 0
                    return (
                      <div key={key} className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-200 capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-mono font-bold text-indigo-300">+{contrib.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 mb-2 overflow-hidden">
                          <div className="bg-indigo-500 h-1.5" style={{ width: `${Math.min((contrib / 25) * 100, 100)}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 font-mono">
                          <span>Raw: {String(factor?.raw_value ?? 'N/A')}</span>
                          <span>Weight: {(weight * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COL */}
        <div className="space-y-6">
          <Card>
            <div className="p-6 border-b border-slate-700/50 bg-indigo-500/10">
              <h3 className="text-lg font-semibold text-indigo-200 flex items-center gap-2">
                <Info className="w-5 h-5" /> AI Recommendation
              </h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-200 leading-relaxed font-medium mb-6">
                "{prediction.recommendation || 'Standard maintenance protocol applies.'}"
              </p>
              
              <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase">Why this priority?</h4>
              
              <div className="space-y-4">
                {highContrib.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-red-400 mb-1 block">HIGH CONTRIBUTION</span>
                    <ul className="text-sm text-slate-300 space-y-1 pl-4 list-disc">
                      {highContrib.map(([k, f]) => <li key={k} className="capitalize">{k.replace(/_/g, ' ')} (+{(Number(f?.contribution) || 0).toFixed(2)})</li>)}
                    </ul>
                  </div>
                )}
                
                {medContrib.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-amber-400 mb-1 block">MEDIUM CONTRIBUTION</span>
                    <ul className="text-sm text-slate-300 space-y-1 pl-4 list-disc">
                      {medContrib.map(([k, f]) => <li key={k} className="capitalize">{k.replace(/_/g, ' ')} (+{(Number(f?.contribution) || 0).toFixed(2)})</li>)}
                    </ul>
                  </div>
                )}
                
                {lowContrib.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-blue-400 mb-1 block">LOW CONTRIBUTION</span>
                    <ul className="text-sm text-slate-300 space-y-1 pl-4 list-disc">
                      {lowContrib.map(([k, f]) => <li key={k} className="capitalize">{k.replace(/_/g, ' ')} (+{(Number(f?.contribution) || 0).toFixed(2)})</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 border-b border-slate-700/50">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Database className="w-4 h-4" /> Data Sources & Context
              </h3>
            </div>
            <div className="p-6 text-sm space-y-3 text-slate-400">
              <div className="flex justify-between">
                <span>Model:</span>
                <span className="text-slate-200">{prediction.model_name || 'AIPriorityEngine'} v{prediction.model_version || '1.0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Training Data:</span>
                <span className="text-slate-200">Statistical Heuristics & Weights</span>
              </div>
              <div className="flex justify-between">
                <span>Asset Source:</span>
                <span className="text-slate-200">Asset Management Module</span>
              </div>
              <div className="flex justify-between">
                <span>Defect Source:</span>
                <span className="text-slate-200">Defect Management Module</span>
              </div>
              <div className="flex justify-between">
                <span>Train Impact:</span>
                <span className="text-slate-200">Train Operations Module</span>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}

export default AIPriorityDetail

