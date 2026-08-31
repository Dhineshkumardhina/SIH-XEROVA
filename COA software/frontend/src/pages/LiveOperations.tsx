import React, { useState, useEffect, useRef } from 'react'
import {
  Radio,
  Play,
  Square,
  Sparkles,
  Trash2,
  Train,
  ShieldAlert,
  Layers,
  Activity,
  AlertTriangle,
  Info,
  ChevronRight
} from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useOperationsStore } from '../store/operationsStore'
import { apiClient } from '../services/api'
import { useNavigate } from 'react-router-dom'

export const LiveOperationsPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    connectionStatus,
    recentEvents,
    clearEvents,
    isFeedPaused,
    setFeedPaused,
    isLiveDemoActive,
    setLiveDemoActive
  } = useOperationsStore()

  // Feed filtering
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const demoIntervalRef = useRef<any>(null)

  // Live Demo Generator Loop
  useEffect(() => {
    if (isLiveDemoActive) {
      demoIntervalRef.current = setInterval(async () => {
        try {
          await apiClient.post('/notifications/demo/generate', {})
        } catch (err) {
          console.error('Demo event generator error:', err)
        }
      }, 6000)
    } else {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current)
        demoIntervalRef.current = null
      }
    }
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current)
      }
    }
  }, [isLiveDemoActive])

  // Single event trigger
  const handleEmitSingleEvent = async (type?: string) => {
    try {
      await apiClient.post('/notifications/demo/generate', {
        event_type: type
      })
    } catch (err) {
      console.error('Failed to emit test event', err)
    }
  }

  // Filter events
  const filteredEvents = recentEvents.filter((e) => {
    if (selectedSeverity !== 'ALL' && e.severity !== selectedSeverity) return false
    if (selectedCategory === 'TRAINS' && !e.event_type.includes('TRAIN')) return false
    if (selectedCategory === 'BLOCKS' && !e.event_type.includes('BLOCK')) return false
    if (selectedCategory === 'DEFECTS' && !e.event_type.includes('DEFECT')) return false
    if (selectedCategory === 'MAINTENANCE' && !e.event_type.includes('MAINTENANCE')) return false
    if (selectedCategory === 'AI' && !e.event_type.includes('AI') && !e.event_type.includes('OPTIMIZATION')) return false
    return true
  })

  return (
    <div className="space-y-6 pb-20 font-sans">
      {/* ── Safety & Synthetic Data Notice ────────────────────────────── */}
      <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
          <span>DEMONSTRATION ENVIRONMENT — REAL-TIME TELEMETRY SIMULATION</span>
        </div>
        <span className="font-mono text-[11px] text-amber-400/80 bg-amber-900/40 px-2.5 py-0.5 rounded border border-amber-500/30">
          WEBSOCKET OPERATIONS FEED
        </span>
      </div>

      <PageHeader
        title="Live Operations & Real-Time Monitoring"
        subtitle="Real-time railway section event stream, train headway tracking, and automated AI possession alerts."
        breadcrumbs={[
          { label: 'Operations', href: '/operations/live' },
          { label: 'Live Stream' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            {isLiveDemoActive ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLiveDemoActive(false)}
                className="border-rose-500/50 text-rose-300 hover:bg-rose-950/50"
                leftIcon={<Square className="w-3.5 h-3.5" />}
              >
                Stop Live Demo
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setLiveDemoActive(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white"
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                Start Live Demo
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEmitSingleEvent()}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            >
              Trigger Event
            </Button>
          </div>
        }
      />

      {/* ── Operational Status Metric Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-sans">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Track Possessions</span>
            <Layers className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 font-mono">2 Active Blocks</p>
          <p className="text-[10px] text-emerald-400 font-mono">COR-A01 & COR-B02 Occupied</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Live Train Headway</span>
            <Train className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-slate-100 font-mono">14 En-Route Trains</p>
          <p className="text-[10px] text-purple-300 font-mono">Punctuality Index 98.4%</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical Asset Alerts</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">2 Active Flaws</p>
          <p className="text-[10px] text-rose-300 font-mono">USFD Railhead Micro-fissures</p>
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>WebSocket Status</span>
            <Radio className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-400 animate-ping'
                  : connectionStatus === 'RECONNECTING'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <p className="text-lg font-bold text-slate-100 font-mono uppercase">{connectionStatus}</p>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">ws://127.0.0.1:8000/ws/operations</p>
        </div>
      </div>

      {/* ── Main Operations Grid: Event Feed & Active Corridors ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Operations Feed */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  LIVE OPERATIONS FEED
                </h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono">
                  {filteredEvents.length} events
                </span>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedPaused(!isFeedPaused)}
                  className={`text-xs ${isFeedPaused ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400'}`}
                >
                  {isFeedPaused ? 'Resume Feed' : 'Pause Feed'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearEvents}
                  className="text-xs text-slate-400 hover:text-rose-400"
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[10px] font-mono uppercase text-slate-500">Category:</span>
              {(['ALL', 'TRAINS', 'BLOCKS', 'DEFECTS', 'MAINTENANCE', 'AI'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
                  }`}
                >
                  {cat}
                </button>
              ))}

              <span className="text-[10px] font-mono uppercase text-slate-500 ml-auto">Severity:</span>
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                    selectedSeverity === sev
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Feed Stream */}
            <div className="divide-y divide-slate-800/60 max-h-[560px] overflow-y-auto font-mono text-xs">
              {filteredEvents.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <Activity className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
                  <p className="text-xs">Awaiting live telemetry events...</p>
                  <p className="text-[10px] text-slate-600">Click "Start Live Demo" or "Trigger Event" to generate events.</p>
                </div>
              ) : (
                filteredEvents.map((evt) => (
                  <div
                    key={evt.event_id}
                    className={`p-3.5 hover:bg-slate-900/40 transition-colors flex items-start gap-3 ${
                      evt.severity === 'CRITICAL' ? 'bg-rose-950/10' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {evt.severity === 'CRITICAL' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : evt.severity === 'WARNING' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{evt.event_type}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                              evt.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                                : evt.severity === 'WARNING'
                                ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                                : 'bg-blue-950 text-blue-300 border-blue-800/60'
                            }`}
                          >
                            {evt.severity}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
                        {evt.message}
                      </p>

                      {evt.data && Object.keys(evt.data).length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                          {evt.corridor_id && <span>Corridor: {evt.corridor_id}</span>}
                          {evt.asset_id && <span>Asset: {evt.asset_id}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Active Possessions & Live Trains Ticker */}
        <div className="space-y-4 font-sans">
          {/* Active Blocks Card */}
          <Card>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Active Corridor Possessions
                </h3>
              </div>
              <Badge variant="success">2 Active</Badge>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-300 font-mono">BP-260830-A01</span>
                  <Badge variant="success">IN PROGRESS</Badge>
                </div>
                <p className="text-xs text-slate-300 font-medium">COR-A01 (Mainline Trunk)</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>01:00 - 03:00 (120 min)</span>
                  <span className="text-emerald-400">ENG + SIG</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-300 font-mono">BP-260830-B02</span>
                  <Badge variant="success">IN PROGRESS</Badge>
                </div>
                <p className="text-xs text-slate-300 font-medium">COR-B02 (Freight Heavy Haul)</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>02:30 - 04:00 (90 min)</span>
                  <span className="text-blue-400">TRC (OHE)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Nav Trigger Card */}
          <Card>
            <div className="p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Real-Time Operations Navigation
              </h4>
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => navigate('/trains')}
                  className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Train className="w-4 h-4 text-purple-400" />
                    <span>Train Operations Schedule</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => navigate('/blocks')}
                  className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Possession Block Manager</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>

                <button
                  onClick={() => navigate('/conflicts')}
                  className="w-full p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Block Conflict Analysis Center</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LiveOperationsPage
