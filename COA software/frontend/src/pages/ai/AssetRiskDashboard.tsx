import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Activity,
  Calculator,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card } from '../../components/ui/Card'
import { Table, type Column } from '../../components/ui/Table'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Select'
import { SearchInput } from '../../components/ui/SearchInput'
import { riskService } from '../../services/risk'
import type { HighRiskAsset, RiskSummary } from '../../types/risk'

export const AssetRiskDashboard: React.FC = () => {
  const [summary, setSummary] = useState<RiskSummary | null>(null)
  const [assets, setAssets] = useState<HighRiskAsset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [riskLevelFilter, setRiskLevelFilter] = useState('ALL')
  const [horizonFilter, setHorizonFilter] = useState('30')
  const [assetTypeFilter] = useState('ALL')

  // Bulk Prediction Modal / State
  const [isBulkRunning, setIsBulkRunning] = useState(false)
  const [bulkStep, setBulkStep] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [summaryRes, highRiskRes] = await Promise.all([
        riskService.getRiskSummary(),
        riskService.getHighRiskAssets({
          page,
          limit: 15,
          department: deptFilter !== 'ALL' ? deptFilter : undefined,
          risk_level: riskLevelFilter !== 'ALL' ? riskLevelFilter : undefined,
          horizon_days: Number(horizonFilter),
          asset_type: assetTypeFilter !== 'ALL' ? assetTypeFilter : undefined
        })
      ])

      if (summaryRes.data) {
        setSummary(summaryRes.data)
      }

      if (highRiskRes?.data) {
        setAssets(highRiskRes.data.items || [])
        setTotal(highRiskRes.data.pagination?.total || 0)
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load asset risk data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, deptFilter, riskLevelFilter, horizonFilter, assetTypeFilter])

  const handleRunSinglePrediction = async (assetId: string) => {
    try {
      await riskService.predictRisk(assetId, Number(horizonFilter))
      loadData()
    } catch (err: any) {
      alert(err?.response?.data?.detail || err?.message || 'Failed to run prediction')
    }
  }

  const handleBulkPrediction = async () => {
    if (!confirm('Execute batch risk prediction across top infrastructure assets?')) return
    try {
      setIsBulkRunning(true)
      setBulkStep('Collecting asset telemetry and maintenance logs...')
      await new Promise((r) => setTimeout(r, 600))
      
      setBulkStep('Analyzing active defects and failure history...')
      await new Promise((r) => setTimeout(r, 600))
      
      setBulkStep('Executing Baseline Risk Model across assets...')
      const assetIds = assets.map((a) => a.asset_id)
      await riskService.predictBulkRisk(assetIds, Number(horizonFilter))
      
      setBulkStep('Persisting risk predictions and factor snapshots...')
      await new Promise((r) => setTimeout(r, 400))
      
      setBulkStep(null)
      await loadData()
    } catch (err: any) {
      alert('Bulk calculation error: ' + (err?.message || 'Unknown error'))
    } finally {
      setIsBulkRunning(false)
      setBulkStep(null)
    }
  }

  const getRiskBadge = (level: string) => {
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

  const columns: Column<HighRiskAsset>[] = [
    {
      key: 'asset_code',
      header: 'Asset Code',
      sortable: true,
      className: 'font-mono font-bold',
      render: (item) => (
        <Link
          to={`/assets/${item.asset_id}`}
          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1"
        >
          {item.asset_code}
        </Link>
      )
    },
    {
      key: 'asset_name',
      header: 'Asset Name / Type',
      render: (item) => (
        <div>
          <div className="font-medium text-slate-200 text-xs">{item.asset_name}</div>
          <div className="text-[10px] text-slate-400 font-mono">{item.asset_type}</div>
        </div>
      )
    },
    {
      key: 'department',
      header: 'Dept',
      render: (item) => <span className="font-mono text-xs text-slate-400">{item.department || 'ENG'}</span>
    },
    {
      key: 'health_score',
      header: 'Health',
      render: (item) => (
        <span
          className={`font-mono text-xs font-bold ${
            item.health_score > 70 ? 'text-emerald-400' : item.health_score > 45 ? 'text-amber-400' : 'text-red-400'
          }`}
        >
          {item.health_score}%
        </span>
      )
    },
    {
      key: 'criticality_score',
      header: 'Crit',
      render: (item) => <span className="font-mono text-xs text-slate-300">{item.criticality_score}</span>
    },
    {
      key: 'risk_score',
      header: 'Risk Score',
      sortable: true,
      render: (item) => {
        const score = Number(item.risk_score) || 0
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-slate-100">{score.toFixed(1)}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getRiskBadge(item.risk_level)}`}>
              {item.risk_level || 'LOW'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'failure_probability',
      header: 'Failure Risk Est.',
      render: (item) => (
        <div className="font-mono text-xs font-semibold text-amber-300">
          {Math.round((Number(item.failure_probability) || 0) * 100)}%
          <span className="text-[10px] text-slate-500 font-normal ml-1">({item.horizon_days ?? 30}d)</span>
        </div>
      )
    },
    {
      key: 'recommendation',
      header: 'Advisory Recommendation',
      render: (item) => (
        <div className="max-w-xs text-xs text-slate-300 truncate" title={item.recommendation || ''}>
          {item.recommendation || 'Routine monitoring.'}
        </div>
      )
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunSinglePrediction(item.asset_id)}
            title="Recalculate risk score"
          >
            Predict
          </Button>
          <Link to={`/assets/${item.asset_id}`}>
            <Button variant="outline" size="sm" leftIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Details
            </Button>
          </Link>
        </div>
      )
    }
  ]

  const safeAssets = Array.isArray(assets) ? assets : []
  const filteredAssets = safeAssets.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.asset_code?.toLowerCase().includes(q) ||
      a.asset_name?.toLowerCase().includes(q) ||
      a.asset_type?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="AI Asset Risk Intelligence"
        subtitle="Predictive risk estimation and failure probability modeling across track, signaling, and electrical infrastructure."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'AI Intelligence' },
          { label: 'Asset Risk Matrix' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsRefreshing(true)
                loadData()
              }}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleBulkPrediction}
              isLoading={isBulkRunning}
              leftIcon={<Calculator className="w-3.5 h-3.5" />}
            >
              Run Batch Risk Analysis
            </Button>
          </div>
        }
      />

      {/* Transparency Banner */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 flex gap-4 items-start shadow-sm">
        <div className="p-2.5 bg-amber-500/10 rounded-lg shrink-0 border border-amber-500/20">
          <Info className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">
              SYNTHETIC DEMONSTRATION — BASELINE RISK MODEL (v1.0.0)
            </h3>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
              DEMO ADVISORY
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">
            Asset risk scores and failure probabilities are mathematical estimates synthesized from asset health,
            unresolved defect severity, overdue work orders, and inspection history. This decision-support system is
            designed to assist maintenance planning and does not replace certified railway engineering inspections.
          </p>
        </div>
      </div>

      {/* Bulk Processing Notification */}
      {isBulkRunning && bulkStep && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 flex items-center gap-3 animate-pulse">
          <Activity className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-sm text-indigo-200 font-medium">{bulkStep}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Critical Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {summary?.critical_risk_count ?? 0}
          </p>
          <span className="text-[10px] text-red-400">Score &ge; 75 / 100</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>High Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {summary?.high_risk_count ?? 0}
          </p>
          <span className="text-[10px] text-amber-400">Score 50 – 74</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Medium Risk</span>
            <Activity className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {summary?.medium_risk_count ?? 0}
          </p>
          <span className="text-[10px] text-yellow-400">Score 25 – 49</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Low Risk</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {summary?.low_risk_count ?? 0}
          </p>
          <span className="text-[10px] text-emerald-400">Score &lt; 25</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Monitored Assets</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-100 mt-2">
            {summary?.total_predictions_monitored ?? 0}
          </p>
          <span className="text-[10px] text-slate-400">Total in inventory</span>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Risk Score</span>
            <Calculator className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-purple-200 mt-2">
            {summary?.average_risk_score ? summary.average_risk_score.toFixed(1) : '0.0'}
          </p>
          <span className="text-[10px] text-purple-400">Network mean</span>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <div className="p-5 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Asset Risk Ranking & Predictions</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked descending by estimated failure probability and multi-factor risk score.
            </p>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-48">
              <SearchInput
                placeholder="Search asset code..."
                value={search}
                onChange={setSearch}
              />
            </div>

            <Select
              value={riskLevelFilter}
              onChange={(e) => {
                setRiskLevelFilter(e.target.value)
                setPage(1)
              }}
              className="w-32 text-xs"
              options={[
                { label: 'All Levels', value: 'ALL' },
                { label: 'Critical', value: 'CRITICAL' },
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' }
              ]}
            />

            <Select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value)
                setPage(1)
              }}
              className="w-32 text-xs"
              options={[
                { label: 'All Depts', value: 'ALL' },
                { label: 'Engineering', value: 'ENG' },
                { label: 'Signal & Telecom', value: 'SIG' },
                { label: 'Traction', value: 'TRAC' }
              ]}
            />

            <Select
              value={horizonFilter}
              onChange={(e) => {
                setHorizonFilter(e.target.value)
                setPage(1)
              }}
              className="w-32 text-xs"
              options={[
                { label: '7-Day Horizon', value: '7' },
                { label: '30-Day Horizon', value: '30' },
                { label: '60-Day Horizon', value: '60' },
                { label: '90-Day Horizon', value: '90' }
              ]}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredAssets}
          isLoading={isLoading}
          error={error}
          onRetry={loadData}
          emptyMessage="No infrastructure assets found matching risk criteria."
          pagination={{
            meta: {
              page,
              page_size: 15,
              total,
              total_pages: Math.ceil(total / 15) || 1,
              has_next: page * 15 < total,
              has_prev: page > 1
            },
            onPageChange: (p) => setPage(p)
          }}
        />
      </Card>
    </div>
  )
}

export default AssetRiskDashboard
