import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  Activity,
  Calculator,
  RefreshCw,
  Info,
  Layers,
  FileText,
  Clock,
  ExternalLink
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { assetService } from '../../services/assets'
import { riskService } from '../../services/risk'
import { RiskFactorBreakdown } from '../../components/risk/RiskFactorBreakdown'
import { RiskTrendChart } from '../../components/risk/RiskTrendChart'
import type { Asset } from '../../types/asset'
import type { RiskPrediction, RiskHistoryItem } from '../../types/risk'

export const AssetDetail: React.FC = () => {
  const { assetId } = useParams<{ assetId: string }>()
  const navigate = useNavigate()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [prediction, setPrediction] = useState<RiskPrediction | null>(null)
  const [history, setHistory] = useState<RiskHistoryItem[]>([])
  const [horizonDays, setHorizonDays] = useState<number>(30)

  const [isLoading, setIsLoading] = useState(true)
  const [isPredicting, setIsPredicting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    if (!assetId) return
    try {
      setIsLoading(true)
      setError(null)

      const [assetRes, riskRes, historyRes] = await Promise.all([
        assetService.getAssetById(assetId),
        riskService.getLatestAssetRisk(assetId, horizonDays),
        riskService.getRiskHistory(assetId)
      ])

      if (assetRes?.data) {
        setAsset(assetRes.data)
      }

      if (riskRes?.data) {
        setPrediction(riskRes.data)
      }

      if (historyRes?.data) {
        setHistory(historyRes.data)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load asset details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [assetId])

  const handleRunPrediction = async () => {
    if (!assetId) return
    try {
      setIsPredicting(true)
      const res = await riskService.predictRisk(assetId, horizonDays)
      if (res.data) {
        setPrediction(res.data)
      }
      const histRes = await riskService.getRiskHistory(assetId)
      if (histRes.data) {
        setHistory(histRes.data)
      }
    } catch (err: any) {
      alert('Prediction calculation failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setIsPredicting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading asset telemetry and AI risk profile...</p>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-400 font-semibold">{error || 'Asset not found'}</div>
        <Button variant="outline" onClick={() => navigate('/assets')}>
          Return to Asset Inventory
        </Button>
      </div>
    )
  }

  const getRiskBadge = (level?: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'LOW':
      default:
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title={`Asset Profile: ${asset.asset_code}`}
        subtitle={`${asset.name} • ${asset.asset_type} • ${asset.department || 'ENG'}`}
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Assets', href: '/assets' },
          { label: asset.asset_code || 'Asset Details' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
              <span className="text-xs text-slate-400 font-medium">Horizon:</span>
              <select
                value={horizonDays}
                onChange={(e) => setHorizonDays(Number(e.target.value))}
                className="bg-transparent text-xs text-slate-200 focus:outline-none"
              >
                <option value={7} className="bg-slate-900">7 Days</option>
                <option value={30} className="bg-slate-900">30 Days</option>
                <option value={60} className="bg-slate-900">60 Days</option>
                <option value={90} className="bg-slate-900">90 Days</option>
              </select>
            </div>
            <Button
              variant="primary"
              onClick={handleRunPrediction}
              isLoading={isPredicting}
              leftIcon={<Calculator className="w-4 h-4" />}
            >
              Run New Prediction
            </Button>
          </div>
        }
      />

      {/* Top Banner: Synthetic Transparency */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            Operating in <strong className="text-slate-200">Synthetic Demonstration Mode</strong> utilizing{' '}
            <strong className="text-slate-200">BaselineRiskModel v1.0.0</strong>.
          </span>
        </div>
        <Link to="/ai/risk" className="text-blue-400 hover:underline flex items-center gap-1 font-medium">
          View Global Risk Matrix <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Risk Score Cockpit & Factors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Risk Cockpit Card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-700/50">
              <div>
                <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                  AI Asset Risk Score
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold font-mono text-slate-100">
                    {prediction ? prediction.risk_score.toFixed(1) : '0.0'}
                  </span>
                  <span className="text-xl text-slate-500 font-mono">/ 100</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase font-mono ${getRiskBadge(
                      prediction?.risk_level
                    )}`}
                  >
                    {prediction?.risk_level || 'LOW'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-l border-slate-700/50 pl-6">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Failure Risk Est.</div>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                    {prediction ? Math.round(prediction.failure_probability * 100) : 0}%
                  </div>
                  <div className="text-[10px] text-slate-500">{prediction?.horizon_days || 30}d window</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Health Score</div>
                  <div
                    className={`text-xl font-bold font-mono mt-0.5 ${
                      asset.health_score > 70
                        ? 'text-emerald-400'
                        : asset.health_score > 45
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {asset.health_score}%
                  </div>
                  <div className="text-[10px] text-slate-500">Telemetry status</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Criticality</div>
                  <div className="text-xl font-bold font-mono text-slate-200 mt-0.5">
                    {asset.criticality_score}
                  </div>
                  <div className="text-[10px] text-slate-500">Asset impact</div>
                </div>
              </div>
            </div>

            {/* Advisory Recommendation Box */}
            <div className="mt-6 space-y-3">
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-1">
                  <Activity className="w-3.5 h-3.5" /> Advisory Recommendation
                </div>
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  "{prediction?.recommendation || 'Continue routine inspection and telemetry monitoring.'}"
                </p>
              </div>

              {prediction?.explanation && (
                <p className="text-xs text-slate-400 leading-relaxed italic bg-slate-800/40 p-3 rounded-lg border border-slate-700/40">
                  {prediction.explanation}
                </p>
              )}
            </div>
          </Card>

          {/* Factor Breakdown */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                Explainable Risk Factor Breakdown
              </h3>
              <span className="text-xs text-slate-400 font-mono">Normalized Contributions</span>
            </div>
            <RiskFactorBreakdown factors={prediction?.factors || []} />
          </Card>

          {/* Historical Risk Trend Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Historical Risk Score Trend
              </h3>
              <span className="text-xs text-slate-400 font-mono">{history.length} Previous Predictions</span>
            </div>
            <RiskTrendChart history={history} />
          </Card>
        </div>

        {/* RIGHT COLUMN: Asset Metadata & Context */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-100 mb-4 pb-3 border-b border-slate-700/50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              Asset Infrastructure Profile
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Asset Code:</span>
                <span className="font-mono font-bold text-slate-200">{asset.asset_code}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Department:</span>
                <span className="font-mono text-slate-200">{asset.department || 'ENG'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Asset Type:</span>
                <span className="text-slate-200">{asset.asset_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Status:</span>
                <StatusBadge status={asset.status} />
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Commission Date:</span>
                <span className="font-mono text-slate-300">
                  {asset.commission_date ? new Date(asset.commission_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Last Inspection:</span>
                <span className="font-mono text-slate-300">
                  {asset.last_inspection_at ? new Date(asset.last_inspection_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Next Inspection Due:</span>
                <span className="font-mono text-slate-300">
                  {asset.next_inspection_at ? new Date(asset.next_inspection_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Location Description:</span>
                <span className="text-slate-300 text-right max-w-xs">{asset.description || 'Main Corridor Track'}</span>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-100 mb-4 pb-3 border-b border-slate-700/50">
              Inter-Module Workflows
            </h3>
            <div className="space-y-2.5">
              <Link to={`/maintenance/tasks`}>
                <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<FileText className="w-4 h-4 text-blue-400" />}>
                  View Maintenance Work Orders
                </Button>
              </Link>
              <Link to={`/defects`}>
                <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<AlertTriangle className="w-4 h-4 text-amber-400" />}>
                  Inspect Unresolved Defects
                </Button>
              </Link>
              <Link to={`/ai/priority`}>
                <Button variant="outline" className="w-full justify-start text-xs" leftIcon={<Calculator className="w-4 h-4 text-purple-400" />}>
                  Open AI Task Priority Queue
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AssetDetail
