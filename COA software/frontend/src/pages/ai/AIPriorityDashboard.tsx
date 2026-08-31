import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Calculator, AlertTriangle, RefreshCw, Activity, ArrowRight, Info } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { aiPriorityService } from '../../services/aiPriority'
import type { AIPriorityPrediction } from '../../types/ai_priority'

export const AIPriorityDashboard: React.FC = () => {
  const [predictions, setPredictions] = useState<AIPriorityPrediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()

  const loadData = async () => {
    try {
      setIsLoading(true)
      const res = await aiPriorityService.getPriorityTasks(100)
      setPredictions(res)
    } catch (err: any) {
      setError(err.message || 'Failed to load priority queue')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleBulkCalculate = async () => {
    if (!confirm('Run bulk priority recalculation for all overdue tasks?')) return
    try {
      setIsCalculating(true)
      await aiPriorityService.recalculatePriorities('overdue')
      await loadData()
    } catch (err: any) {
      alert(err.message || 'Calculation failed')
    } finally {
      setIsCalculating(false)
    }
  }

  const columns: Column<AIPriorityPrediction>[] = [
    { key: 'priority_score', header: 'Score', sortable: true, render: (item) => {
      const score = Number(item.priority_score) || 0
      return (
        <div className="flex flex-col">
          <span className="font-mono text-lg font-bold">{score.toFixed(1)}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-1 w-max ${
            item.priority_level === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
            item.priority_level === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            item.priority_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}>
            {item.priority_level || 'NORMAL'}
          </span>
        </div>
      )
    }},
    { key: 'task_id', header: 'Task Ref', className: 'font-mono text-blue-400', render: (item) => (
      <Link to={`/ai/priority/${item.task_id}`} className="hover:underline flex items-center gap-1">
        {item.task_id}
      </Link>
    )},
    { key: 'recommendation', header: 'AI Recommendation', render: (item) => (
      <span className="text-sm text-slate-300">{item.recommendation || 'Standard protocol'}</span>
    )},
    { key: 'actions', header: '', render: (item) => (
      <Button variant="outline" size="sm" onClick={() => navigate(`/ai/priority/${item.task_id}`)}>
        Analyze <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    )}
  ]

  const safePredictions = Array.isArray(predictions) ? predictions : []
  const criticalCount = safePredictions.filter(p => p.priority_level === 'CRITICAL').length
  const avgScore = safePredictions.length > 0 ? (safePredictions.reduce((acc, p) => acc + (Number(p.priority_score) || 0), 0) / safePredictions.length).toFixed(1) : '0.0'


  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="AI Maintenance Priority"
        subtitle="Explainable prioritization of maintenance activities based on risk, severity, and operational impact."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'AI Intelligence' },
          { label: 'Maintenance Priority' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Refresh
            </Button>
            <Button variant="primary" onClick={handleBulkCalculate} isLoading={isCalculating} leftIcon={<Calculator className="w-4 h-4" />}>
              Calculate Priorities
            </Button>
          </div>
        }
      />

      {/* Transparency Notice */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex gap-4 items-start shadow-sm">
        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">AI Decision Support</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
            Priority scores are decision-support recommendations generated from configured rules and available system data. 
            They are not a substitute for authorized railway engineering judgment. Currently operating in DEMONSTRATION mode 
            using the RuleBasedPriorityModel v1.0.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Critical Tasks</h3>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{criticalCount}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">High Priority</h3>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{predictions.filter(p => p.priority_level === 'HIGH').length}</p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Medium/Low</h3>
            <Activity className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">
            {predictions.filter(p => p.priority_level === 'MEDIUM' || p.priority_level === 'LOW').length}
          </p>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-400">Avg Priority Score</h3>
            <Calculator className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 mt-2">{avgScore}</p>
        </Card>
      </div>

      <Card>
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-slate-100">AI Priority Queue</h2>
          <p className="text-sm text-slate-400">Top prioritized maintenance tasks sorted by AI score.</p>
        </div>
        <Table
          columns={columns}
          data={predictions}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          emptyMessage="No priority predictions available. Run priority analysis to generate recommendations."
        />
      </Card>
    </div>
  )
}

export default AIPriorityDashboard
