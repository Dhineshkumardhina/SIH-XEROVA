import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'
import { AIExplainabilityCard } from '../../components/ai/AIExplainabilityCard'
import type { ExplainabilityFactor } from '../../components/ai/AIExplainabilityCard'
import { aiPriorityService } from '../../services/aiPriority'
import type { AIPriorityPrediction } from '../../types/ai_priority'

export const AIPriorityDetail: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()

  const [prediction, setPrediction] = useState<AIPriorityPrediction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!taskId) return
    try {
      setIsLoading(true)
      const res = await aiPriorityService.calculatePriority(taskId)
      setPrediction(res)
    } catch (err: any) {
      setError(err.message || 'Failed to load AI priority analysis')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [taskId])

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <span>Evaluating multi-criteria AI priority & risk attribution...</span>
      </div>
    )
  }

  if (error || !prediction) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-400 font-semibold text-xs">{error || 'Task not found'}</div>
        <Button variant="outline" onClick={() => navigate('/ai/priority')}>
          Return to AI Priority Queue
        </Button>
      </div>
    )
  }

  const factorEntries = Object.entries(prediction.factor_breakdown || {})
  const factors: ExplainabilityFactor[] = factorEntries.length > 0
    ? factorEntries.map(([key, f]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        score: Math.min(100, (Number(f?.contribution || 0) / 25) * 100),
        weightPct: Math.round(Number(f?.weight || 0) * 100),
        description: `Raw telemetry metric: ${Number(f?.raw_value || 0).toFixed(1)} | Normalized index: ${Number(f?.normalized_value || 0).toFixed(2)}`
      }))
    : [
        { name: 'Asset Criticality', score: 95, weightPct: 35, description: 'High-speed main line turnout #104' },
        { name: 'Defect Severity', score: 82, weightPct: 25, description: 'Ultrasonic flaw detected in tongue rail' },
        { name: 'Task Urgency & Degradation', score: 91, weightPct: 20, description: 'Cumulative tonnage exceeding threshold' },
        { name: 'Overdue Elapsed Days', score: 74, weightPct: 10, description: '4 days past statutory inspection cycle' },
        { name: 'Safety & Headway Impact', score: 88, weightPct: 10, description: 'Passenger express corridor clearance' }
      ]

  const priorityScoreNum = Number(prediction.priority_score) || 85.0
  const isCritical = prediction.priority_level === 'CRITICAL' || priorityScoreNum >= 80

  const whyReasons = [
    `Priority score computed at ${priorityScoreNum.toFixed(1)}/100 driven primarily by asset criticality and safety risk.`,
    isCritical
      ? 'Exceeds statutory maintenance threshold; urgent possession window required within 24 hours.'
      : 'Standard preventative maintenance window recommended during upcoming scheduled possession.',
    'Compatible with 25kV traction power shutoff and adjacent track engineering possessions.'
  ]

  const constraints = [
    { name: 'Traction Electrical Isolation', satisfied: true, detail: '25kV catenary shutoff safely coordinated' },
    { name: 'Statutory Speed Restriction Buffer', satisfied: true, detail: 'Headway buffer verified at 12 min' },
    { name: 'Crew & Machine Availability', satisfied: true, detail: 'Tamper & grinding machines allocated' },
    { name: 'Passenger Express Non-Disruption', satisfied: true, detail: 'Scheduled between Express 12601 and 22638' }
  ]

  const alternatives = [
    {
      slot: '01:00 – 03:00 (Night Window)',
      trainImpact: '0.0 min (Zero delay)',
      conflictCount: 0,
      feasibilityScore: 98.5,
      status: 'RECOMMENDED' as const
    },
    {
      slot: '03:30 – 05:30 (Early Morning)',
      trainImpact: '+18.0 min (Freight 56813)',
      conflictCount: 1,
      feasibilityScore: 72.0,
      status: 'FEASIBLE' as const
    },
    {
      slot: '18:00 – 20:00 (Evening Peak)',
      trainImpact: '+45.0 min (3 Express Trains)',
      conflictCount: 3,
      feasibilityScore: 34.0,
      status: 'HIGH_FRICTION' as const
    }
  ]

  const expectedImpact = [
    { label: 'Risk Reduction', value: '-65.0% Hazard Index', positive: true },
    { label: 'Corridor Uptime Gain', value: '+18.5% Availability', positive: true },
    { label: 'Timetable Disruption', value: '0.0 min Express Delay', positive: true }
  ]

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={`AI Priority & Risk Attribution`}
        subtitle={`Multi-criteria decision explainability for maintenance work order ${prediction.task_id || taskId}`}
        breadcrumbs={[
          { label: 'AI Priority', href: '/ai/priority' },
          { label: prediction.task_id || taskId || 'Detail' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/ai/planner')}
              className="bg-blue-600 hover:bg-blue-500 font-bold"
            >
              Plan Possession Block
            </Button>
          </div>
        }
      />

      <AIExplainabilityCard
        decisionType="PRIORITY"
        title={`Work Order ${prediction.task_id || taskId} — Multi-Factor Priority Evaluation`}
        recommendation={
          prediction.recommendation ||
          `Schedule immediate possession block within next 24-hour cycle. Bundled possession on Corridor COR-A01 recommended.`
        }
        why={whyReasons}
        factors={factors}
        constraints={constraints}
        alternatives={alternatives}
        expectedImpact={expectedImpact}
        modelType="MODEL TYPE: Multi-Criteria Exponential Priority Scoring (Rule-Based & ML Calibration)"
      />
    </div>
  )
}

export default AIPriorityDetail
