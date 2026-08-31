import React, { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  Calendar,
  Layers,
  Clock,
  Radio,
  Eye,
  FileSpreadsheet,
  FileType,
  Loader2,
  SlidersHorizontal,
  X
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { reportService } from '../services/reports'
import type {
  ReportType,
  ReportItem,
  ReportDetail,
  ReportCardMeta
} from '../types/reports'

interface ReportsPageProps {
  frequency?: string
}

const REPORT_CATALOG: ReportCardMeta[] = [
  {
    type: 'DAILY_BLOCK_PLAN',
    name: 'Daily Divisional Block Plan',
    description: 'Day-of-operation planned possessions, section occupancy windows, multi-dept consolidations, and train headway impact.',
    frequency: 'DAILY',
    category: 'BLOCKS',
    badgeColor: 'blue'
  },
  {
    type: 'WEEKLY_BLOCK_PLAN',
    name: 'Weekly Multi-Horizon Block Plan',
    description: '7-day balanced maintenance workload distribution, critical task coverage, and weekly corridor downtime projections.',
    frequency: 'WEEKLY',
    category: 'BLOCKS',
    badgeColor: 'purple'
  },
  {
    type: 'MONTHLY_BLOCK_PLAN',
    name: 'Monthly Capacity & Maintenance Plan',
    description: '30-day corridor maintenance demand, track capacity envelope utilization, and cyclic inspection requirements.',
    frequency: 'MONTHLY',
    category: 'BLOCKS',
    badgeColor: 'purple'
  },
  {
    type: 'MAINTENANCE_REPORT',
    name: 'Department Maintenance Performance',
    description: 'Comprehensive breakdown of civil track, signaling, and OHE maintenance execution, completion rate, and statutory backlog.',
    frequency: 'ON_DEMAND',
    category: 'MAINTENANCE',
    badgeColor: 'emerald'
  },
  {
    type: 'ASSET_AVAILABILITY',
    name: 'Asset Reliability & Health Registry',
    description: 'Fleet-wide health scores, degradation distribution, critical asset registry, and predictive risk rankings.',
    frequency: 'ON_DEMAND',
    category: 'ASSETS',
    badgeColor: 'emerald'
  },
  {
    type: 'TRAIN_IMPACT',
    name: 'Train Operations Delay Impact',
    description: 'Predicted delays across passenger express, local commuters, and goods freight trains during active possession blocks.',
    frequency: 'ON_DEMAND',
    category: 'OPERATIONS',
    badgeColor: 'amber'
  },
  {
    type: 'AI_OPTIMIZATION',
    name: 'AI Block Optimization & Savings Report',
    description: 'Mathematical CP-SAT optimization results, multi-department possession consolidation, and Before vs After comparison.',
    frequency: 'ON_DEMAND',
    category: 'OPERATIONS',
    badgeColor: 'purple'
  },
  {
    type: 'CONFLICT_REPORT',
    name: 'Possession Conflict & Safety Analysis',
    description: 'Train-block overlaps, electrical isolation boundary conflicts, section headway breaches, and resolution audits.',
    frequency: 'ON_DEMAND',
    category: 'OPERATIONS',
    badgeColor: 'red'
  },
  {
    type: 'EXECUTIVE_SUMMARY',
    name: 'Executive Railway Operations Summary',
    description: 'High-level executive briefing with primary operational KPIs, key findings, and AI root-cause recommendations.',
    frequency: 'ON_DEMAND',
    category: 'EXECUTIVE',
    badgeColor: 'blue'
  }
]

export const ReportsPage: React.FC<ReportsPageProps> = ({ frequency = 'catalog' }) => {
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'catalog' | 'daily' | 'weekly' | 'monthly' | 'history'>(
    frequency === 'daily'
      ? 'daily'
      : frequency === 'weekly'
      ? 'weekly'
      : frequency === 'monthly'
      ? 'monthly'
      : 'catalog'
  )

  // Reports state
  const [history, setHistory] = useState<ReportItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true)

  // Config modal state
  const [selectedReportType, setSelectedReportType] = useState<ReportType | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false)
  const [selectedDept, setSelectedDept] = useState<string>('ALL')
  const [selectedCorridor, setSelectedCorridor] = useState<string>('ALL')
  const [includeDetails, setIncludeDetails] = useState<boolean>(true)
  const [includeAiExpl, setIncludeAiExpl] = useState<boolean>(true)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generationStep, setGenerationStep] = useState<string>('')

  // Preview modal state
  const [previewReport, setPreviewReport] = useState<ReportDetail | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false)

  // Load history
  const loadHistory = async () => {
    try {
      setIsLoadingHistory(true)
      const res = await reportService.getReportHistory(50)
      setHistory(res.data || [])
    } catch (err) {
      console.error('Failed to load report history', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  // Open config modal for a specific report
  const handleOpenConfig = (type: ReportType) => {
    setSelectedReportType(type)
    setIsConfigOpen(true)
  }

  // Execute report generation
  const handleGenerate = async () => {
    if (!selectedReportType) return
    try {
      setIsGenerating(true)
      setGenerationStep('Collecting database telemetry...')
      await new Promise((r) => setTimeout(r, 400))

      setGenerationStep('Calculating operational metrics & risk formulas...')
      await new Promise((r) => setTimeout(r, 400))

      setGenerationStep('Generating document tables & summaries...')
      const res = await reportService.generateReport({
        report_type: selectedReportType,
        department: selectedDept === 'ALL' ? undefined : selectedDept,
        corridor_id: selectedCorridor === 'ALL' ? undefined : selectedCorridor,
        options: {
          include_charts: true,
          include_details: includeDetails,
          include_ai_explanation: includeAiExpl
        }
      })

      setIsConfigOpen(false)
      setPreviewReport(res.data)
      setIsPreviewOpen(true)
      loadHistory()
    } catch (err) {
      console.error('Failed to generate report', err)
    } finally {
      setIsGenerating(false)
      setGenerationStep('')
    }
  }

  // Preview existing report
  const handlePreview = async (id: string) => {
    try {
      const res = await reportService.getReportById(id)
      setPreviewReport(res.data)
      setIsPreviewOpen(true)
    } catch (err) {
      console.error('Failed to fetch report preview', err)
    }
  }

  return (
    <div className="space-y-6 pb-20">
      {/* ── Safety & Synthetic Data Disclaimer ────────────────────────── */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span>DEMONSTRATION ENVIRONMENT — SYNTHETIC OPERATIONAL REPORTS</span>
        </div>
        <span className="font-mono text-[11px] text-amber-400/80 bg-amber-900/40 px-2.5 py-0.5 rounded border border-amber-500/30">
          REGULATORY & EXECUTIVE EXPORT ENGINE
        </span>
      </div>

      <PageHeader
        title="Operations Report Center"
        subtitle="Generate, preview, and export regulatory maintenance block plans and executive intelligence in PDF, CSV, and Excel formats."
        breadcrumbs={[
          { label: 'Intelligence & Metrics', href: '/analytics' },
          { label: 'Reports', href: '/reports' },
          { label: activeTab.toUpperCase() }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenConfig('DAILY_BLOCK_PLAN')}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Generate Daily Plan
            </Button>
          </div>
        }
      />

      {/* ── Sub-Module Navigation Tabs ──────────────────────────────── */}
      <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'catalog' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileType className="w-4 h-4" />
          Report Catalog
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          Daily Block Plan
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'weekly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Weekly Plan
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'monthly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Monthly Capacity
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Report History & Downloads
        </button>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: REPORT CATALOG                                            */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {REPORT_CATALOG.map((card) => (
            <Card key={card.type} className="flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant={card.badgeColor === 'blue' ? 'info' : card.badgeColor === 'purple' ? 'purple' : card.badgeColor === 'emerald' ? 'success' : 'warning'}>
                    {card.frequency}
                  </Badge>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">{card.category}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{card.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{card.description}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-400 font-mono border-t border-slate-800">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">PDF</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">CSV</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">EXCEL</span>
                </div>
              </div>
              <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-center justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenConfig(card.type)}
                  leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                >
                  Configure & Generate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: DAILY BLOCK PLAN VIEW                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'daily' && (
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Daily Divisional Block Execution Schedule
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Approved track possession slots and section occupancy windows</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenConfig('DAILY_BLOCK_PLAN')}
                leftIcon={<FileText className="w-3.5 h-3.5" />}
              >
                Export Daily PDF
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Plan Code</th>
                    <th className="py-2.5 px-3">Corridor</th>
                    <th className="py-2.5 px-3">Window</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Disciplines</th>
                    <th className="py-2.5 px-3">Headway Delay</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-purple-300">BP-260830-A01</td>
                    <td className="py-2.5 px-3 text-slate-200">COR-A01</td>
                    <td className="py-2.5 px-3 text-slate-300">01:00 - 03:00</td>
                    <td className="py-2.5 px-3 text-slate-400">120 min</td>
                    <td className="py-2.5 px-3 text-emerald-400 font-bold">ENG + SIG (Shared)</td>
                    <td className="py-2.5 px-3 text-amber-400">+8.0 min</td>
                    <td className="py-2.5 px-3"><Badge variant="success">APPROVED</Badge></td>
                    <td className="py-2.5 px-3 text-slate-300">Control Officer</td>
                  </tr>
                  <tr className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-purple-300">BP-260830-B02</td>
                    <td className="py-2.5 px-3 text-slate-200">COR-B02</td>
                    <td className="py-2.5 px-3 text-slate-300">02:30 - 04:00</td>
                    <td className="py-2.5 px-3 text-slate-400">90 min</td>
                    <td className="py-2.5 px-3 text-slate-300">TRC (OHE Maintenance)</td>
                    <td className="py-2.5 px-3 text-emerald-400">0.0 min (Low Traffic)</td>
                    <td className="py-2.5 px-3"><Badge variant="success">APPROVED</Badge></td>
                    <td className="py-2.5 px-3 text-slate-300">Control Officer</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: WEEKLY PLAN VIEW                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'weekly' && (
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Weekly 7-Day Workload Distribution Matrix
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Balanced day-by-day maintenance allocation and corridor downtime</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenConfig('WEEKLY_BLOCK_PLAN')}
                leftIcon={<FileText className="w-3.5 h-3.5" />}
              >
                Export Weekly Excel
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Blocks Allocated</th>
                    <th className="py-2.5 px-3">Total Tasks</th>
                    <th className="py-2.5 px-3">Critical Tasks</th>
                    <th className="py-2.5 px-3">Predicted Delay</th>
                    <th className="py-2.5 px-3">Block Utilization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, idx) => (
                    <tr key={day} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{day}</td>
                      <td className="py-2.5 px-3 text-purple-300">{2 + (idx % 2)} Blocks</td>
                      <td className="py-2.5 px-3 text-slate-300">{5 + idx} Tasks</td>
                      <td className="py-2.5 px-3 text-amber-400">{1 + (idx % 2)} Critical</td>
                      <td className="py-2.5 px-3 text-emerald-400">+{6.0 + (idx * 0.5)} min</td>
                      <td className="py-2.5 px-3 text-emerald-300 font-bold">{88.0 + (idx % 5)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: MONTHLY CAPACITY VIEW                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'monthly' && (
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Monthly 30-Day Corridor Capacity & Maintenance Plan
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Corridor capacity envelope, cyclic testing schedules, and fleet availability</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenConfig('MONTHLY_BLOCK_PLAN')}
                leftIcon={<FileText className="w-3.5 h-3.5" />}
              >
                Export Monthly Report
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Total Monthly Possessions</span>
                <p className="text-2xl font-bold text-slate-100">42 Blocks</p>
                <p className="text-[10px] text-purple-400 font-mono">12 Multi-Dept Shared</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Consolidated Maintenance</span>
                <p className="text-2xl font-bold text-blue-400">148 Tasks</p>
                <p className="text-[10px] text-emerald-400 font-mono">100% Statutory Clearance</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Corridor Downtime Saved</span>
                <p className="text-2xl font-bold text-emerald-300">+38.5 Hours</p>
                <p className="text-[10px] text-emerald-400 font-mono">55.6% Downtime Reduction</p>
              </div>
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase">Average Asset Availability</span>
                <p className="text-2xl font-bold text-emerald-400">96.8%</p>
                <p className="text-[10px] text-slate-500 font-mono">Optimal Fleet Benchmark</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TAB 5: REPORT HISTORY & DOWNLOADS                                */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <Card>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Generated Report Repository
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Historical report generation records and direct export downloads</p>
              </div>
              <Button variant="ghost" size="sm" onClick={loadHistory}>
                Refresh History
              </Button>
            </div>

            {isLoadingHistory ? (
              <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Loading report repository...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-mono">
                No reports generated yet. Click 'Generate' on any report card above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Report Code</th>
                      <th className="py-2.5 px-3">Title</th>
                      <th className="py-2.5 px-3">Generated By</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {history.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-200">{r.report_code}</td>
                        <td className="py-2.5 px-3 text-slate-300 font-sans font-medium">{r.title}</td>
                        <td className="py-2.5 px-3 text-slate-400">{r.generated_by}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {new Date(r.created_at).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge variant={r.status === 'COMPLETED' ? 'success' : 'warning'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 font-sans">
                            <button
                              onClick={() => handlePreview(r.id)}
                              className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => reportService.downloadPdf(r.id, `${r.report_code.toLowerCase()}.pdf`)}
                              className="p-1.5 rounded hover:bg-slate-800 text-blue-400 hover:text-blue-300 transition-colors"
                              title="Download PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => reportService.downloadCsv(r.id, `${r.report_code.toLowerCase()}.csv`)}
                              className="p-1.5 rounded hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 transition-colors"
                              title="Export CSV"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => reportService.downloadExcel(r.id, `${r.report_code.toLowerCase()}.xlsx`)}
                              className="p-1.5 rounded hover:bg-slate-800 text-purple-400 hover:text-purple-300 transition-colors"
                              title="Export Excel"
                            >
                              <FileType className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: REPORT CONFIGURATION MODAL                              */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isConfigOpen && selectedReportType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Configure {selectedReportType.replace(/_/g, ' ')}
                </h3>
              </div>
              <button onClick={() => !isGenerating && setIsConfigOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Department Filter */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Department Boundary</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-bold"
                >
                  <option value="ALL">All Departments (Consolidated)</option>
                  <option value="ENG">Track Engineering (TMS)</option>
                  <option value="SIG">Signal & Telecom (SMMS)</option>
                  <option value="TRC">Traction / OHE (TDMS)</option>
                </select>
              </div>

              {/* Corridor Selector */}
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Corridor Scope</label>
                <select
                  value={selectedCorridor}
                  onChange={(e) => setSelectedCorridor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-bold"
                >
                  <option value="ALL">All Railway Corridors (Division-Wide)</option>
                  <option value="COR-A01">COR-A01 (Mainline Trunk)</option>
                  <option value="COR-B02">COR-B02 (Freight Heavy Haul)</option>
                  <option value="COR-C03">COR-C03 (Suburban East)</option>
                  <option value="COR-D04">COR-D04 (Northern Branch)</option>
                  <option value="COR-E05">COR-E05 (Southern Chord)</option>
                </select>
              </div>

              {/* Inclusion Options */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Report Content Modules</label>
                <div className="space-y-2 text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDetails}
                      onChange={(e) => setIncludeDetails(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600"
                    />
                    <span>Include Detailed Entity Itemization (Blocks / Tasks / Assets)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAiExpl}
                      onChange={(e) => setIncludeAiExpl(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600"
                    />
                    <span>Include AI Root-Cause Explanations & Optimization Insights</span>
                  </label>
                </div>
              </div>

              {/* Generation Progress Indicator */}
              {isGenerating && (
                <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-center gap-3 text-blue-200">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400 flex-shrink-0" />
                  <span className="text-[11px] font-mono">{generationStep}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsConfigOpen(false)} disabled={isGenerating}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? 'Compiling Report...' : 'Compile & Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: LIVE REPORT PREVIEW MODAL                               */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {isPreviewOpen && previewReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-sm text-slate-100">{previewReport.title}</h3>
                </div>
                <p className="text-[11px] font-mono text-slate-400">
                  Code: {previewReport.report_code} | Generated: {new Date(previewReport.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reportService.downloadPdf(previewReport.id, `${previewReport.report_code.toLowerCase()}.pdf`)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reportService.downloadCsv(previewReport.id, `${previewReport.report_code.toLowerCase()}.csv`)}
                  leftIcon={<FileSpreadsheet className="w-3.5 h-3.5" />}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reportService.downloadExcel(previewReport.id, `${previewReport.report_code.toLowerCase()}.xlsx`)}
                  leftIcon={<FileType className="w-3.5 h-3.5" />}
                >
                  Excel
                </Button>
                <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs font-sans">
              {/* Synthetic Data Notice */}
              <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-center gap-2 text-amber-300 text-[11px]">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                <span>SYNTHETIC DEMONSTRATION REPORT — NOT CONNECTED TO LIVE SIGNALING</span>
              </div>

              {/* Summary KPIs */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono">
                  1. Executive Operational Metrics
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(previewReport.summary_metrics || {}).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase">{k.replace(/_/g, ' ')}</span>
                      <p className="text-base font-bold text-slate-100 font-mono">
                        {String(v)}{typeof v === 'number' && k.includes('pct') ? '%' : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Breakdown */}
              {previewReport.parameters?.details && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider font-mono">
                    2. Registry Itemization Breakdown
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto">
                    <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">
                      {JSON.stringify(previewReport.parameters.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-mono text-[10px]">RAILOPT AI — Automated Regulatory Reporting</span>
              <Button variant="ghost" size="sm" onClick={() => setIsPreviewOpen(false)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
