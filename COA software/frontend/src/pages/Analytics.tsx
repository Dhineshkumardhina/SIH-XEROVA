import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  TrendingUp,
  Activity,
  Layers,
  Clock,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Filter,
  Calendar,
  Building2,
  Radio,
  FileSpreadsheet
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { analyticsService } from '../services/analytics'
import type {
  DashboardKPIs,
  AssetAnalyticsData,
  MaintenanceAnalyticsData,
  BlockAnalyticsData,
  TrainImpactAnalyticsData,
  CorridorAnalyticsData
} from '../types/analytics'

interface AnalyticsPageProps {
  subModule?: string
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ subModule = 'overview' }) => {
  const navigate = useNavigate()

  // Tab state
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'maintenance' | 'blocks' | 'train-impact'>(
    subModule === 'assets'
      ? 'assets'
      : subModule === 'maintenance'
      ? 'maintenance'
      : subModule === 'blocks'
      ? 'blocks'
      : subModule === 'train-impact'
      ? 'train-impact'
      : 'overview'
  )

  // Filters state
  const [dateRange, setDateRange] = useState<string>('30_DAYS')
  const [selectedDept, setSelectedDept] = useState<string>('ALL')
  const [selectedCorridor, setSelectedCorridor] = useState<string>('ALL')

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardKPIs | null>(null)
  const [assetData, setAssetData] = useState<AssetAnalyticsData | null>(null)
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceAnalyticsData | null>(null)
  const [blockData, setBlockData] = useState<BlockAnalyticsData | null>(null)
  const [trainData, setTrainData] = useState<TrainImpactAnalyticsData | null>(null)
  const [corridorData, setCorridorData] = useState<CorridorAnalyticsData | null>(null)
  const [, setIsLoading] = useState<boolean>(true)

  // Fetch Data based on active tab & filters
  const fetchData = async () => {
    try {
      setIsLoading(true)
      const deptParam = selectedDept === 'ALL' ? undefined : selectedDept
      const corrParam = selectedCorridor === 'ALL' ? undefined : selectedCorridor

      if (activeTab === 'overview') {
        const [dashRes, corrRes] = await Promise.all([
          analyticsService.getDashboard({ department: deptParam, corridor_id: corrParam }),
          analyticsService.getCorridorAnalytics()
        ])
        setDashboardData(dashRes.data)
        setCorridorData(corrRes.data)
      } else if (activeTab === 'assets') {
        const res = await analyticsService.getAssetAnalytics({ department: deptParam, corridor_id: corrParam })
        setAssetData(res.data)
      } else if (activeTab === 'maintenance') {
        const res = await analyticsService.getMaintenanceAnalytics({ department: deptParam, corridor_id: corrParam })
        setMaintenanceData(res.data)
      } else if (activeTab === 'blocks') {
        const res = await analyticsService.getBlockAnalytics({ corridor_id: corrParam })
        setBlockData(res.data)
      } else if (activeTab === 'train-impact') {
        const res = await analyticsService.getTrainImpactAnalytics({ corridor_id: corrParam })
        setTrainData(res.data)
      }
    } catch (err) {
      console.error('Failed to load analytics data', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [activeTab, dateRange, selectedDept, selectedCorridor])

  // Export to CSV helper
  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Category,Metric,Value\nAsset,Availability,96.8%\nBlock,Utilization,87.4%\nMaintenance,Completion,78.5%\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `railopt_analytics_${activeTab}_${dateRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Safety & Synthetic Data Disclaimer ────────────────────────── */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span>DEMONSTRATION ENVIRONMENT — SYNTHETIC OPERATIONAL ANALYTICS</span>
        </div>
        <span className="font-mono text-[11px] text-amber-400/80 bg-amber-900/40 px-2.5 py-0.5 rounded border border-amber-500/30">
          COMPUTED FROM ACTIVE SYSTEM TELEMETRY
        </span>
      </div>

      <PageHeader
        title="Operations Analytics & Performance Intelligence"
        subtitle="Data-driven intelligence across infrastructure assets, maintenance workload, corridor capacity, and train operations."
        breadcrumbs={[
          { label: 'Intelligence & Metrics', href: '/analytics' },
          { label: activeTab.toUpperCase() }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}>
              Export Report
            </Button>
          </div>
        }
      />

      {/* ── Global Filter Bar ─────────────────────────────────────────── */}
      <Card>
        <div className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-bold"
              >
                <option value="TODAY">Today</option>
                <option value="7_DAYS">Last 7 Days</option>
                <option value="30_DAYS">Last 30 Days</option>
                <option value="90_DAYS">Quarter to Date</option>
              </select>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-bold"
              >
                <option value="ALL">All Departments</option>
                <option value="ENG">Track Engineering (TMS)</option>
                <option value="SIG">Signal & Telecom (SMMS)</option>
                <option value="TRC">Traction / OHE (TDMS)</option>
              </select>
            </div>

            {/* Corridor Filter */}
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCorridor}
                onChange={(e) => setSelectedCorridor(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs font-bold"
              >
                <option value="ALL">All Railway Corridors</option>
                <option value="COR-A01">COR-A01 (Mainline Trunk)</option>
                <option value="COR-B02">COR-B02 (Freight Heavy Haul)</option>
                <option value="COR-C03">COR-C03 (Suburban East)</option>
                <option value="COR-D04">COR-D04 (Northern Branch)</option>
                <option value="COR-E05">COR-E05 (Southern Chord)</option>
              </select>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchData} leftIcon={<Filter className="w-3.5 h-3.5" />}>
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* ── Sub-Module Navigation Tabs ──────────────────────────────── */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Operations Overview
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'assets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Asset Analytics
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'maintenance' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Maintenance Workload
        </button>
        <button
          onClick={() => setActiveTab('blocks')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'blocks' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Blocks & Shared Possession
        </button>
        <button
          onClick={() => setActiveTab('train-impact')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'train-impact' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Train Delay Impact
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: OPERATIONS OVERVIEW                                       */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && dashboardData && (
        <div className="space-y-6">
          {/* Top Executive KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="cursor-pointer hover:border-emerald-500/50 transition-all" onClick={() => navigate('/assets')}>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Asset Availability</p>
                <p className="text-xl font-bold text-emerald-300 mt-0.5">{dashboardData.asset_availability.availability_pct}%</p>
                <p className="text-[10px] text-slate-500 font-mono">{dashboardData.asset_availability.healthy_assets}/{dashboardData.asset_availability.total_assets} Healthy</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-purple-500/50 transition-all" onClick={() => navigate('/blocks')}>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Block Utilization</p>
                <p className="text-xl font-bold text-purple-400 mt-0.5">{dashboardData.block_utilization.utilization_pct}%</p>
                <p className="text-[10px] text-slate-500 font-mono">{dashboardData.block_utilization.active_blocks} Active Plans</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-blue-500/50 transition-all" onClick={() => navigate('/maintenance')}>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Task Completion</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{dashboardData.maintenance.completion_rate_pct}%</p>
                <p className="text-[10px] text-slate-500 font-mono">{dashboardData.maintenance.completed_tasks}/{dashboardData.maintenance.total_tasks} Executed</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-red-500/50 transition-all" onClick={() => navigate('/maintenance')}>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Overdue Tasks</p>
                <p className={`text-xl font-bold mt-0.5 ${dashboardData.maintenance.total_overdue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {dashboardData.maintenance.total_overdue}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">{dashboardData.maintenance.critical_overdue} Critical</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-blue-500/50 transition-all" onClick={() => navigate('/trains')}>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Train Delay Impact</p>
                <p className={`text-xl font-bold mt-0.5 ${dashboardData.train_impact.total_delay_minutes > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {dashboardData.train_impact.total_delay_minutes} min
                </p>
                <p className="text-[10px] text-slate-500 font-mono">{dashboardData.train_impact.affected_trains} Affected</p>
              </div>
            </Card>
            <Card className="cursor-pointer hover:border-purple-500/50 transition-all" onClick={() => setActiveTab('blocks')}>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Shared Blocks</p>
                <p className="text-xl font-bold text-purple-300 mt-0.5">{dashboardData.shared_blocks.total_shared_blocks}</p>
                <p className="text-[10px] text-emerald-400 font-mono">+{dashboardData.shared_blocks.hours_saved}h Saved</p>
              </div>
            </Card>
          </div>

          {/* AI Operational Insights Panel */}
          <Card>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    AI Operational Insights & Root-Cause Advisory
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {dashboardData.insights.map((ins, i) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      ins.severity === 'CRITICAL'
                        ? 'bg-red-950/30 border-red-500/40 text-red-200'
                        : ins.severity === 'WARNING'
                        ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                        : 'bg-blue-950/30 border-blue-500/40 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] uppercase tracking-wider">{ins.category}</span>
                      <Badge variant={ins.severity === 'CRITICAL' ? 'danger' : ins.severity === 'WARNING' ? 'warning' : 'info'}>
                        {ins.severity}
                      </Badge>
                    </div>
                    <p className="font-bold text-slate-100">{ins.title}</p>
                    <p className="text-[11px] text-slate-300">{ins.description}</p>
                    <div className="pt-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
                      <strong>Rec:</strong> {ins.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Corridor Performance & Risk Ranking */}
          {corridorData && (
            <Card>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Corridor Operational Performance & Risk Ranking
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Formula: {corridorData.formula}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">Corridor</th>
                        <th className="py-2.5 px-3">Availability</th>
                        <th className="py-2.5 px-3">Critical Assets</th>
                        <th className="py-2.5 px-3">Open Defects</th>
                        <th className="py-2.5 px-3">Overdue Tasks</th>
                        <th className="py-2.5 px-3">Active Blocks</th>
                        <th className="py-2.5 px-3">Risk Score</th>
                        <th className="py-2.5 px-3">Tier</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {corridorData.corridors.map((c) => (
                        <tr key={c.corridor_id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-200">{c.corridor_code} ({c.corridor_name})</td>
                          <td className="py-2.5 px-3 text-emerald-300 font-bold">{c.asset_availability_pct}%</td>
                          <td className="py-2.5 px-3 text-amber-400">{c.critical_assets}</td>
                          <td className="py-2.5 px-3 text-red-400">{c.critical_defects}</td>
                          <td className="py-2.5 px-3 text-amber-400">{c.overdue_tasks}</td>
                          <td className="py-2.5 px-3 text-purple-300">{c.active_blocks}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-100">{c.risk_score}/100</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={c.risk_tier === 'CRITICAL' ? 'danger' : c.risk_tier === 'HIGH' ? 'warning' : 'success'}>
                              {c.risk_tier}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => navigate(`/corridors`)}
                              className="text-blue-400 hover:text-blue-300 font-sans font-medium text-xs flex items-center gap-1 ml-auto"
                            >
                              Inspect <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: ASSET ANALYTICS                                           */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'assets' && assetData && (
        <div className="space-y-6">
          {/* Asset KPIs Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Total Assets</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{assetData.kpis.total_assets}</p>
                <p className="text-[10px] text-slate-500 font-mono">Avg Criticality: {assetData.kpis.avg_criticality}</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Healthy Assets</p>
                <p className="text-xl font-bold text-emerald-300 mt-0.5">{assetData.kpis.healthy + assetData.kpis.monitor}</p>
                <p className="text-[10px] text-emerald-400 font-mono">{assetData.kpis.healthy} Optimal / {assetData.kpis.monitor} Monitor</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Degraded / Critical</p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">{assetData.kpis.degraded + assetData.kpis.critical}</p>
                <p className="text-[10px] text-red-400 font-mono">{assetData.kpis.critical} High Risk</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Average Health Score</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{assetData.kpis.avg_health_score}/100</p>
                <p className="text-[10px] text-slate-500 font-mono">Fleet Quality Metric</p>
              </div>
            </Card>
          </div>

          {/* Department Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assetData.department_analytics.map((d) => (
              <Card key={d.department_code}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-slate-200">{d.department_name} ({d.department_code})</span>
                    <span className="font-mono text-[11px] text-blue-400">{d.asset_count} Assets</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span>Avg Health Score:</span>
                      <span className="font-bold text-emerald-300">{d.avg_health_score}/100</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>Critical Assets:</span>
                      <span className="font-bold">{d.critical_assets}</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>Open Defects:</span>
                      <span className="font-bold">{d.open_defects}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Critical Assets Table */}
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Critical Asset Risk Ranking Table
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Sorted by Risk Score DESC</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Asset Code</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Dept</th>
                      <th className="py-2.5 px-3">Corridor</th>
                      <th className="py-2.5 px-3">Health Score</th>
                      <th className="py-2.5 px-3">Criticality</th>
                      <th className="py-2.5 px-3">Open Defects</th>
                      <th className="py-2.5 px-3">Risk Score</th>
                      <th className="py-2.5 px-3">Next Maint</th>
                      <th className="py-2.5 px-3 text-right">Drill-down</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {assetData.critical_assets.map((a) => (
                      <tr key={a.asset_id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{a.asset_code}</td>
                        <td className="py-2.5 px-3 text-slate-400">{a.asset_type}</td>
                        <td className="py-2.5 px-3 text-slate-300">{a.department_code}</td>
                        <td className="py-2.5 px-3 text-slate-300">{a.corridor_code}</td>
                        <td className={`py-2.5 px-3 font-bold ${a.health_score < 60 ? 'text-red-400' : 'text-amber-400'}`}>{a.health_score}%</td>
                        <td className="py-2.5 px-3 text-slate-300">{a.criticality}</td>
                        <td className="py-2.5 px-3 text-red-400 font-bold">{a.open_defects}</td>
                        <td className="py-2.5 px-3 font-bold text-red-300">{a.risk_score}</td>
                        <td className="py-2.5 px-3 text-slate-400">{a.next_maintenance}</td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => navigate(`/assets/${a.asset_id}`)}
                            className="text-blue-400 hover:text-blue-300 font-sans font-medium text-xs flex items-center gap-1 ml-auto"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: MAINTENANCE ANALYTICS                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'maintenance' && maintenanceData && (
        <div className="space-y-6">
          {/* Maintenance KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Total Tasks</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{maintenanceData.kpis.total_tasks}</p>
                <p className="text-[10px] text-slate-500 font-mono">Avg Duration: {maintenanceData.kpis.avg_duration_minutes}m</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Completion Rate</p>
                <p className="text-xl font-bold text-emerald-300 mt-0.5">{maintenanceData.kpis.completion_rate_pct}%</p>
                <p className="text-[10px] text-emerald-400 font-mono">{maintenanceData.kpis.completed} Executed</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Overdue Tasks</p>
                <p className={`text-xl font-bold mt-0.5 ${maintenanceData.kpis.overdue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {maintenanceData.kpis.overdue}
                </p>
                <p className="text-[10px] text-red-400 font-mono">{maintenanceData.kpis.critical} Critical Priority</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">In Progress / Pending</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{maintenanceData.kpis.in_progress + maintenanceData.kpis.pending}</p>
                <p className="text-[10px] text-slate-500 font-mono">{maintenanceData.kpis.in_progress} Active Now</p>
              </div>
            </Card>
          </div>

          {/* Overdue Maintenance Intelligence Table */}
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Overdue Maintenance Tasks Intelligence
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-slate-500">Sorted by Overdue Days DESC</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Task Code</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Asset</th>
                      <th className="py-2.5 px-3">Dept</th>
                      <th className="py-2.5 px-3">Corridor</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3">Overdue Days</th>
                      <th className="py-2.5 px-3">Priority</th>
                      <th className="py-2.5 px-3 text-right">Drill-down</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {maintenanceData.overdue_table.map((t) => (
                      <tr key={t.task_id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{t.task_code}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans max-w-[200px] truncate">{t.description}</td>
                        <td className="py-2.5 px-3 text-slate-400">{t.asset_code}</td>
                        <td className="py-2.5 px-3 text-slate-300">{t.department_code}</td>
                        <td className="py-2.5 px-3 text-slate-300">{t.corridor_code}</td>
                        <td className="py-2.5 px-3 text-slate-400">{t.due_date}</td>
                        <td className="py-2.5 px-3 font-bold text-red-400">+{t.overdue_days}d</td>
                        <td className="py-2.5 px-3">
                          <Badge variant={t.priority === 'CRITICAL' ? 'danger' : 'warning'}>
                            {t.priority}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => navigate('/maintenance')}
                            className="text-blue-400 hover:text-blue-300 font-sans font-medium text-xs flex items-center gap-1 ml-auto"
                          >
                            Schedule <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: BLOCKS & SHARED POSSESSION                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'blocks' && blockData && (
        <div className="space-y-6">
          {/* Block KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Total Block Plans</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{blockData.kpis.total_blocks}</p>
                <p className="text-[10px] text-purple-300 font-mono">{blockData.kpis.approved} Approved</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Block Utilization</p>
                <p className="text-xl font-bold text-purple-400 mt-0.5">{blockData.kpis.block_utilization_pct}%</p>
                <p className="text-[10px] text-emerald-400 font-mono">High Efficiency</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Shared Multi-Dept Blocks</p>
                <p className="text-xl font-bold text-emerald-300 mt-0.5">{blockData.kpis.shared_blocks}</p>
                <p className="text-[10px] text-emerald-400 font-mono">+{blockData.shared_blocks_summary.hours_saved}h Saved</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Average Duration</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{blockData.duration_analysis.avg_duration_minutes} min</p>
                <p className="text-[10px] text-slate-500 font-mono">Min: {blockData.duration_analysis.min_duration_minutes}m / Max: {blockData.duration_analysis.max_duration_minutes}m</p>
              </div>
            </Card>
          </div>

          {/* Multi-Department Coordination & Before/After Card */}
          <Card>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    SIH Impact: Manual Baseline vs AI Optimized Plan
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  SYNTHETIC SIMULATION RESULT
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
                  <p className="text-slate-400 font-semibold uppercase tracking-wider">Manual Sequential Plan</p>
                  <div className="space-y-1.5 text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span>Block Occupation:</span>
                      <span className="font-bold text-slate-100">{blockData.before_vs_after.manual_plan.block_occupation_minutes} min</span>
                    </div>
                    <div className="flex justify-between text-amber-400">
                      <span>Train Delay:</span>
                      <span className="font-bold">+{blockData.before_vs_after.manual_plan.train_delay_minutes} min</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Utilization:</span>
                      <span className="font-bold">{blockData.before_vs_after.manual_plan.block_utilization_pct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shared Blocks:</span>
                      <span className="font-bold">0</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 space-y-2">
                  <p className="text-purple-300 font-semibold uppercase tracking-wider">AI Coordinated Shared Plan</p>
                  <div className="space-y-1.5 text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span>Block Occupation:</span>
                      <span className="font-bold text-purple-300">{blockData.before_vs_after.ai_optimized.block_occupation_minutes} min</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Train Delay:</span>
                      <span className="font-bold">+{blockData.before_vs_after.ai_optimized.train_delay_minutes} min</span>
                    </div>
                    <div className="flex justify-between text-purple-300">
                      <span>Utilization:</span>
                      <span className="font-bold">{blockData.before_vs_after.ai_optimized.block_utilization_pct}%</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Shared Blocks:</span>
                      <span className="font-bold">{blockData.before_vs_after.ai_optimized.shared_blocks} Coordinated</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <p className="text-emerald-300 font-semibold uppercase tracking-wider">Operational Productivity Gain</p>
                  <div className="space-y-1.5 text-slate-300 font-mono">
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Track Downtime Saved:</span>
                      <span>+{blockData.before_vs_after.savings.time_saved_minutes} min ({blockData.before_vs_after.savings.downtime_reduction_pct}%)</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Train Delay Avoided:</span>
                      <span>+{blockData.before_vs_after.savings.delay_avoided_minutes} min</span>
                    </div>
                    <div className="flex justify-between text-slate-300 font-sans">
                      <span>Disciplines Coordinated:</span>
                      <span className="font-mono">ENG + SIG + TRC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: TRAIN IMPACT ANALYTICS                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'train-impact' && trainData && (
        <div className="space-y-6">
          {/* Train Impact KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Affected Trains</p>
                <p className="text-xl font-bold text-slate-100 mt-0.5">{trainData.kpis.affected_trains}</p>
                <p className="text-[10px] text-slate-500 font-mono">{trainData.kpis.passenger_affected} Pass / {trainData.kpis.goods_affected} Freight</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Total Predicted Delay</p>
                <p className="text-xl font-bold text-amber-400 mt-0.5">{trainData.kpis.total_delay_minutes} min</p>
                <p className="text-[10px] text-slate-500 font-mono">Across Active Possessions</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Average Delay</p>
                <p className="text-xl font-bold text-blue-400 mt-0.5">{trainData.kpis.avg_delay_minutes} min</p>
                <p className="text-[10px] text-slate-500 font-mono">Per Affected Train</p>
              </div>
            </Card>
            <Card>
              <div className="p-3">
                <p className="text-[10px] text-slate-400 uppercase">Maximum Delay</p>
                <p className="text-xl font-bold text-red-400 mt-0.5">{trainData.kpis.max_delay_minutes} min</p>
                <p className="text-[10px] text-slate-500 font-mono">Worst-case bottleneck</p>
              </div>
            </Card>
          </div>

          {/* Impact by Train Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {trainData.impact_by_type.map((t) => (
              <Card key={t.train_type}>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-slate-200">{t.train_type} Trains</span>
                    <span className="font-mono text-[11px] text-blue-400">{t.affected_trains} Affected</span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span>Total Delay:</span>
                      <span className="font-bold text-amber-400">{t.total_delay_minutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Delay:</span>
                      <span className="font-bold text-slate-200">{t.avg_delay} min</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnalyticsPage
