import { useState, useEffect, useRef } from 'react'
import { Cpu, Play, Pause, RotateCcw, Clock, Train, AlertTriangle, Zap } from 'lucide-react'
import { cn } from '../shared/utils'

interface SimEvent {
  time: string
  type: 'train' | 'block' | 'conflict' | 'resolved'
  message: string
}

function generateSimEvents(): SimEvent[] {
  return [
    { time: '00:00', type: 'train', message: 'Train 12301 Rajdhani departs Station Alpha → Bravo' },
    { time: '00:30', type: 'block', message: 'Block BP-SIM-01 activated on Section A-B (Track Grinding)' },
    { time: '01:00', type: 'train', message: 'Train 12456 Express enters Section C-D' },
    { time: '01:15', type: 'conflict', message: '⚠ Conflict: Train 12302 routed through blocked Section A-B' },
    { time: '01:16', type: 'resolved', message: '✓ AI rerouted Train 12302 via Loop Line. +4 min delay' },
    { time: '02:00', type: 'train', message: 'Train 12501 Freight clears Section C-D' },
    { time: '02:30', type: 'block', message: 'Block BP-SIM-02 activated on Bravo Yard (Points Renewal)' },
    { time: '03:00', type: 'conflict', message: '⚠ Conflict: Shunting movement blocked at Bravo Yard' },
    { time: '03:01', type: 'resolved', message: '✓ Shunting deferred by 30 min. No revenue train impact' },
    { time: '04:00', type: 'block', message: 'Block BP-SIM-01 completed on Section A-B' },
    { time: '04:30', type: 'block', message: 'Block BP-SIM-02 completed on Bravo Yard' },
    { time: '05:00', type: 'train', message: 'Normal operations resume. All corridors clear.' },
  ]
}

export default function SimulationPage() {
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [eventIndex, setEventIndex] = useState(0)
  const events = useRef(generateSimEvents())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const visibleEvents = events.current.slice(0, eventIndex)

  useEffect(() => {
    if (running && eventIndex < events.current.length) {
      timerRef.current = setInterval(() => {
        setEventIndex((prev) => {
          if (prev >= events.current.length) {
            setRunning(false)
            return prev
          }
          return prev + 1
        })
      }, 1500 / speed)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running, speed, eventIndex])

  const reset = () => {
    setRunning(false)
    setEventIndex(0)
  }

  const progress =
    events.current.length > 0
      ? (eventIndex / events.current.length) * 100
      : 0

  const typeColors: Record<SimEvent['type'], string> = {
    train: 'border-blue-500/30 bg-blue-500/5',
    block: 'border-purple-500/30 bg-purple-500/5',
    conflict: 'border-red-500/30 bg-red-500/5',
    resolved: 'border-emerald-500/30 bg-emerald-500/5',
  }

  const typeIcons: Record<SimEvent['type'], React.ElementType> = {
    train: Train,
    block: Clock,
    conflict: AlertTriangle,
    resolved: Zap,
  }

  const typeTextColors: Record<SimEvent['type'], string> = {
    train: 'text-blue-400',
    block: 'text-purple-400',
    conflict: 'text-red-400',
    resolved: 'text-emerald-400',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          Simulation
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Run a time-stepped simulation of block plans against live train movements.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setRunning(!running)}
          className={cn(
            'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all',
            running
              ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/25'
          )}
        >
          {running ? (
            <>
              <Pause className="w-4 h-4" /> Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> {eventIndex > 0 ? 'Resume' : 'Start Simulation'}
            </>
          )}
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/60 text-gray-600 text-sm font-medium border border-gray-200 hover:bg-white/70 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-slate-500">Speed:</span>
          {[1, 2, 5].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium transition-all',
                speed === s ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30' : 'bg-white/50 text-gray-400 border border-gray-300 hover:border-gray-400'
              )}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="rounded-xl bg-white/50 border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400">Simulation Progress</span>
          <span className="text-xs font-mono text-slate-400">
            {eventIndex}/{events.current.length} events
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Event Feed */}
      <div className="rounded-xl bg-white/50 border border-gray-200 p-5 min-h-[400px]">
        <h2 className="text-sm font-semibold text-slate-200 mb-4">Event Log</h2>
        {visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Cpu className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">Press "Start Simulation" to begin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleEvents.map((evt, i) => {
              const Icon = typeIcons[evt.type]
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border transition-all duration-500 animate-in fade-in slide-in-from-left-2',
                    typeColors[evt.type]
                  )}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', typeTextColors[evt.type])} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-200">{evt.message}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-500 flex-shrink-0">
                    {evt.time}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
