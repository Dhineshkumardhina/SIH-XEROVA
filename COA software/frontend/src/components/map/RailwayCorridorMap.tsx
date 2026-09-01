import React, { useState, useEffect, useRef } from 'react'
import {
  Train as TrainIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wrench,
  Zap,
  Info,
  X,
  Compass,
} from 'lucide-react'
import { cn } from '../../shared/utils'
import { Badge } from '../ui/Badge'

export interface RailwayCorridorMapProps {
  height?: string | number
  compact?: boolean
  selectedCorridorId?: string
  onSelectCorridor?: (id: string) => void
  showControls?: boolean
  className?: string
}

interface StationNode {
  id: string
  code: string
  name: string
  km: number
  x: number
  y: number
  platforms: number
  hasJunction: boolean
  signalAspect: 'GREEN' | 'YELLOW' | 'DOUBLE_YELLOW' | 'RED'
}

interface CorridorLine {
  id: string
  code: string
  name: string
  distanceKm: number
  trackCount: number
  electrified: boolean
  density: 'LOW' | 'NORMAL' | 'HIGH' | 'CONGESTED'
  availabilityPct: number
  stations: StationNode[]
  pathD: string
}

interface MapTrain {
  id: string
  number: string
  name: string
  type: 'PASSENGER' | 'EXPRESS' | 'FREIGHT' | 'SPECIAL'
  corridorId: string
  progress: number
  direction: 'UP' | 'DOWN'
  speedKmph: number
  currentSection: string
  status: 'ON_TIME' | 'DELAYED' | 'CRITICAL'
  delayMinutes: number
}

interface ActiveBlockOverlay {
  id: string
  code: string
  corridorId: string
  department: 'ENG' | 'SIG' | 'TRC' | 'OHE'
  fromKm: number
  toKm: number
  fromX: number
  toX: number
  fromY: number
  toY: number
  durationMins: number
  remainingMins: number
  reason: string
}

const CORRIDOR_DATA: CorridorLine[] = [
  {
    id: 'cor-001',
    code: 'COR-A01',
    name: 'NDLS - CNB - PRYJ - DDU Main Trunk',
    distanceKm: 750,
    trackCount: 4,
    electrified: true,
    density: 'HIGH',
    availabilityPct: 94.8,
    pathD: 'M 80 180 C 220 160, 360 210, 500 220 C 640 230, 780 270, 920 290',
    stations: [
      { id: 'st-01', code: 'NDLS', name: 'New Delhi', km: 0, x: 80, y: 180, platforms: 16, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-02', code: 'GZB', name: 'Ghaziabad Jn', km: 28, x: 190, y: 170, platforms: 6, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-03', code: 'ALJN', name: 'Aligarh Jn', km: 131, x: 320, y: 195, platforms: 7, hasJunction: false, signalAspect: 'YELLOW' },
      { id: 'st-04', code: 'TDL', name: 'Tundla Jn', km: 209, x: 450, y: 215, platforms: 5, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-05', code: 'CNB', name: 'Kanpur Central', km: 440, x: 600, y: 228, platforms: 10, hasJunction: true, signalAspect: 'DOUBLE_YELLOW' },
      { id: 'st-06', code: 'PRYJ', name: 'Prayagraj Jn', km: 635, x: 760, y: 260, platforms: 10, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-07', code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', km: 750, x: 920, y: 290, platforms: 8, hasJunction: true, signalAspect: 'GREEN' },
    ],
  },
  {
    id: 'cor-002',
    code: 'COR-B02',
    name: 'DER - RE - FL Western Freight Trunk',
    distanceKm: 640,
    trackCount: 2,
    electrified: true,
    density: 'CONGESTED',
    availabilityPct: 91.2,
    pathD: 'M 100 380 C 260 340, 420 380, 580 400 C 720 420, 830 450, 910 490',
    stations: [
      { id: 'st-08', code: 'DER', name: 'Dadri DFC Yard', km: 0, x: 100, y: 380, platforms: 4, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-09', code: 'RE', name: 'Rewari Jn', km: 82, x: 300, y: 355, platforms: 8, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-10', code: 'FL', name: 'Phulera Jn', km: 290, x: 520, y: 390, platforms: 5, hasJunction: true, signalAspect: 'RED' },
      { id: 'st-11', code: 'AII', name: 'Ajmer Jn', km: 374, x: 710, y: 425, platforms: 6, hasJunction: true, signalAspect: 'YELLOW' },
      { id: 'st-12', code: 'PNU', name: 'Palanpur Jn', km: 640, x: 910, y: 490, platforms: 4, hasJunction: true, signalAspect: 'GREEN' },
    ],
  },
  {
    id: 'cor-003',
    code: 'COR-C03',
    name: 'BPQ - KZJ - SC Southern Spine',
    distanceKm: 480,
    trackCount: 2,
    electrified: true,
    density: 'NORMAL',
    availabilityPct: 97.4,
    pathD: 'M 120 490 C 300 470, 480 490, 640 480 C 760 470, 840 450, 900 430',
    stations: [
      { id: 'st-13', code: 'BPQ', name: 'Balharshah Jn', km: 0, x: 120, y: 490, platforms: 5, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-14', code: 'RDM', name: 'Ramagundam', km: 142, x: 380, y: 480, platforms: 3, hasJunction: false, signalAspect: 'GREEN' },
      { id: 'st-15', code: 'KZJ', name: 'Kazipet Jn', km: 235, x: 620, y: 482, platforms: 4, hasJunction: true, signalAspect: 'GREEN' },
      { id: 'st-16', code: 'SC', name: 'Secunderabad Jn', km: 480, x: 900, y: 430, platforms: 10, hasJunction: true, signalAspect: 'GREEN' },
    ],
  },
]

const INITIAL_TRAINS: MapTrain[] = [
  { id: 'tr-01', number: '22436', name: 'Vande Bharat Express', type: 'EXPRESS', corridorId: 'cor-001', progress: 38, direction: 'DOWN', speedKmph: 130, currentSection: 'ALJN - TDL', status: 'ON_TIME', delayMinutes: 0 },
  { id: 'tr-02', number: '12301', name: 'Howrah Rajdhani', type: 'EXPRESS', corridorId: 'cor-001', progress: 68, direction: 'DOWN', speedKmph: 125, currentSection: 'CNB - PRYJ', status: 'ON_TIME', delayMinutes: 0 },
  { id: 'tr-03', number: '12423', name: 'Dibrugarh Rajdhani', type: 'EXPRESS', corridorId: 'cor-001', progress: 14, direction: 'UP', speedKmph: 110, currentSection: 'GZB - NDLS', status: 'DELAYED', delayMinutes: 12 },
  { id: 'tr-04', number: 'BOXN-884', name: 'Heavy Coal Freight', type: 'FREIGHT', corridorId: 'cor-002', progress: 54, direction: 'DOWN', speedKmph: 75, currentSection: 'FL - AII', status: 'ON_TIME', delayMinutes: 0 },
  { id: 'tr-05', number: 'CONT-402', name: 'Container Goods DFC', type: 'FREIGHT', corridorId: 'cor-002', progress: 24, direction: 'UP', speedKmph: 85, currentSection: 'RE - DER', status: 'ON_TIME', delayMinutes: 0 },
  { id: 'tr-06', number: '12723', name: 'Telangana Express', type: 'EXPRESS', corridorId: 'cor-003', progress: 62, direction: 'DOWN', speedKmph: 115, currentSection: 'KZJ - SC', status: 'ON_TIME', delayMinutes: 0 },
]

const ACTIVE_BLOCKS: ActiveBlockOverlay[] = [
  {
    id: 'blk-01',
    code: 'BLK-OPT-101',
    corridorId: 'cor-001',
    department: 'ENG',
    fromKm: 185,
    toKm: 215,
    fromX: 410,
    toX: 470,
    fromY: 205,
    toY: 220,
    durationMins: 120,
    remainingMins: 45,
    reason: 'Deep Track Screening & Ballast Tamping',
  },
  {
    id: 'blk-02',
    code: 'BLK-OPT-204',
    corridorId: 'cor-002',
    department: 'OHE',
    fromKm: 310,
    toKm: 330,
    fromX: 550,
    toX: 620,
    fromY: 395,
    toY: 410,
    durationMins: 90,
    remainingMins: 70,
    reason: '25kV Feeder Wire & Catenary Tensioning',
  },
]

export const RailwayCorridorMap: React.FC<RailwayCorridorMapProps> = ({
  height = '480px',
  selectedCorridorId = 'cor-001',
  onSelectCorridor,
  showControls = true,
  className,
}) => {
  const [activeCorridorId, setActiveCorridorId] = useState<string>(selectedCorridorId)
  const [zoom, setZoom] = useState<number>(1)
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  
  const [showSignals, setShowSignals] = useState(true)
  const [showTrains, setShowTrains] = useState(true)
  const [showBlocks, setShowBlocks] = useState(true)
  const [mapMode, setMapMode] = useState<'SCHEMATIC' | 'GEOGRAPHIC'>('SCHEMATIC')

  const [selectedStation, setSelectedStation] = useState<StationNode | null>(null)
  const [selectedTrain, setSelectedTrain] = useState<MapTrain | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<ActiveBlockOverlay | null>(null)

  const [trains, setTrains] = useState<MapTrain[]>(INITIAL_TRAINS)
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => {
          const step = (t.speedKmph / 100) * 0.3
          let newProgress = t.direction === 'DOWN' ? t.progress + step : t.progress - step
          let newDirection = t.direction
          if (newProgress >= 98) {
            newProgress = 98
            newDirection = 'UP'
          } else if (newProgress <= 2) {
            newProgress = 2
            newDirection = 'DOWN'
          }
          return {
            ...t,
            progress: newProgress,
            direction: newDirection,
          }
        })
      )
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2))
  const handleZoomOut = () => setZoom((z) => Math.max(0.6, z - 0.2))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  const handleSelectCorridor = (id: string) => {
    setActiveCorridorId(id)
    if (onSelectCorridor) onSelectCorridor(id)
  }

  const activeCorridor = CORRIDOR_DATA.find((c) => c.id === activeCorridorId) || CORRIDOR_DATA[0]

  const getTrainCoordinates = (corridor: CorridorLine, progress: number) => {
    const totalStations = corridor.stations.length
    if (totalStations < 2) return { x: 100, y: 200 }
    
    const segment = (progress / 100) * (totalStations - 1)
    const idx = Math.min(Math.floor(segment), totalStations - 2)
    const localT = segment - idx

    const s1 = corridor.stations[idx]
    const s2 = corridor.stations[idx + 1]

    return {
      x: s1.x + (s2.x - s1.x) * localT,
      y: s1.y + (s2.y - s1.y) * localT,
    }
  }

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col',
        className
      )}
      style={{ height }}
    >
      {/* Map Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-600 text-white">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              GIS Railway Topology & Corridor Map
            </span>
          </div>

          {/* Corridor Selection Pills */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
            {CORRIDOR_DATA.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCorridor(c.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                  activeCorridorId === c.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>

        {/* Right Layer Toggles & Mode */}
        <div className="flex items-center gap-2">
          {showControls && (
            <>
              {/* Map Mode Toggle */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  onClick={() => setMapMode('SCHEMATIC')}
                  className={cn(
                    'px-2 py-0.5 rounded transition-all cursor-pointer',
                    mapMode === 'SCHEMATIC' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                  )}
                >
                  Schematic
                </button>
                <button
                  onClick={() => setMapMode('GEOGRAPHIC')}
                  className={cn(
                    'px-2 py-0.5 rounded transition-all cursor-pointer',
                    mapMode === 'GEOGRAPHIC' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                  )}
                >
                  GIS Geo
                </button>
              </div>

              {/* Layer Toggles */}
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={() => setShowTrains((s) => !s)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1',
                    showTrains
                      ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                  )}
                >
                  <TrainIcon className="w-3 h-3" /> Trains
                </button>
                <button
                  onClick={() => setShowBlocks((s) => !s)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1',
                    showBlocks
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                  )}
                >
                  <Wrench className="w-3 h-3" /> Blocks
                </button>
                <button
                  onClick={() => setShowSignals((s) => !s)}
                  className={cn(
                    'px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1',
                    showSignals
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                  )}
                >
                  <Zap className="w-3 h-3" /> Signals
                </button>
              </div>

              {/* Zoom Buttons */}
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                <button
                  onClick={handleZoomIn}
                  className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleZoomOut}
                  className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetView}
                  className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                  title="Reset View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Corridor Summary Metrics Ribbon */}
      <div className="px-4 py-1.5 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {activeCorridor.name} ({activeCorridor.code})
          </span>
          <span>Distance: <strong className="text-slate-900 dark:text-slate-100">{activeCorridor.distanceKm} km</strong></span>
          <span>Tracks: <strong className="text-slate-900 dark:text-slate-100">{activeCorridor.trackCount} Lines Quad Track</strong></span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Zap className="w-3 h-3" /> 25kV AC Electrified
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>Corridor Availability: <strong className="text-emerald-600 dark:text-emerald-400">{activeCorridor.availabilityPct}%</strong></span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
            Live Feeds Active
          </span>
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div
        className="relative flex-1 w-full h-full bg-slate-50/50 dark:bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 1000 600"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800/60" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Grid Background */}
          <rect width="1000" height="600" fill="url(#grid)" />

          {/* Background Map Contours */}
          {mapMode === 'GEOGRAPHIC' && (
            <g className="text-slate-300/40 dark:text-slate-800/40" stroke="currentColor" fill="none" strokeWidth="1" strokeDasharray="4 4">
              <path d="M 50 100 Q 250 50, 450 120 T 850 140" />
              <path d="M 120 280 Q 300 240, 600 320 T 950 360" />
              <path d="M 40 450 Q 350 420, 700 500 T 960 520" />
            </g>
          )}

          {/* Render All Corridor Tracks */}
          {CORRIDOR_DATA.map((corridor) => {
            const isSelected = corridor.id === activeCorridorId
            return (
              <g key={corridor.id} className="transition-opacity duration-300" opacity={isSelected ? 1 : 0.45}>
                <path
                  d={corridor.pathD}
                  fill="none"
                  stroke={isSelected ? '#3b82f6' : '#94a3b8'}
                  strokeWidth={isSelected ? 8 : 4}
                  strokeLinecap="round"
                  opacity={0.3}
                />
                
                <path
                  d={corridor.pathD}
                  fill="none"
                  stroke={isSelected ? '#2563eb' : '#64748b'}
                  strokeWidth={isSelected ? 4 : 2.5}
                  strokeLinecap="round"
                />

                <path
                  d={corridor.pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 3 : 2}
                  strokeDasharray="2 8"
                  opacity={0.8}
                />

                <text
                  x={corridor.stations[0].x}
                  y={corridor.stations[0].y - 28}
                  fill="currentColor"
                  className="text-[11px] font-black tracking-wider fill-slate-800 dark:fill-slate-200"
                >
                  {corridor.code}: {corridor.name}
                </text>
              </g>
            )
          })}

          {/* Active Maintenance Blocks Overlays */}
          {showBlocks &&
            ACTIVE_BLOCKS.map((blk) => {
              if (blk.corridorId !== activeCorridorId && activeCorridorId !== 'all') return null
              return (
                <g
                  key={blk.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedBlock(blk)
                    setSelectedStation(null)
                    setSelectedTrain(null)
                  }}
                >
                  <line
                    x1={blk.fromX}
                    y1={blk.fromY}
                    x2={blk.toX}
                    y2={blk.toY}
                    stroke="#ef4444"
                    strokeWidth="12"
                    strokeLinecap="round"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                  <line
                    x1={blk.fromX}
                    y1={blk.fromY}
                    x2={blk.toX}
                    y2={blk.toY}
                    stroke="#dc2626"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                  />
                  <circle cx={(blk.fromX + blk.toX) / 2} cy={(blk.fromY + blk.toY) / 2} r="10" fill="#dc2626" />
                  <text
                    x={(blk.fromX + blk.toX) / 2}
                    y={(blk.fromY + blk.toY) / 2 + 3}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="bold"
                  >
                    !
                  </text>
                </g>
              )
            })}

          {/* Stations & Kilometer Posts */}
          {activeCorridor.stations.map((st) => (
            <g
              key={st.id}
              className="cursor-pointer group"
              onClick={() => {
                setSelectedStation(st)
                setSelectedTrain(null)
                setSelectedBlock(null)
              }}
            >
              {st.hasJunction && (
                <circle cx={st.x} cy={st.y} r="12" fill="#3b82f6" opacity="0.25" className="animate-ping" />
              )}

              <circle
                cx={st.x}
                cy={st.y}
                r={st.hasJunction ? 7 : 5.5}
                fill="#ffffff"
                stroke="#1e293b"
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-125"
              />

              <circle cx={st.x} cy={st.y} r={st.hasJunction ? 3.5 : 2.5} fill="#2563eb" />

              {showSignals && (
                <circle
                  cx={st.x + 8}
                  cy={st.y - 8}
                  r="3.5"
                  fill={
                    st.signalAspect === 'GREEN'
                      ? '#22c55e'
                      : st.signalAspect === 'YELLOW' || st.signalAspect === 'DOUBLE_YELLOW'
                      ? '#eab308'
                      : '#ef4444'
                  }
                  stroke="#0f172a"
                  strokeWidth="1"
                />
              )}

              <text
                x={st.x}
                y={st.y + 18}
                textAnchor="middle"
                fill="currentColor"
                className="text-[10px] font-bold fill-slate-900 dark:fill-slate-100 group-hover:fill-blue-600 transition-colors"
              >
                {st.code}
              </text>
              <text
                x={st.x}
                y={st.y + 28}
                textAnchor="middle"
                fill="currentColor"
                className="text-[8px] font-mono fill-slate-500 dark:fill-slate-400"
              >
                Km {st.km}
              </text>
            </g>
          ))}

          {/* Real-time Moving Trains */}
          {showTrains &&
            trains
              .filter((t) => t.corridorId === activeCorridorId)
              .map((t) => {
                const coords = getTrainCoordinates(activeCorridor, t.progress)
                const isSelected = selectedTrain?.id === t.id
                return (
                  <g
                    key={t.id}
                    className="cursor-pointer"
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => {
                      setSelectedTrain(t)
                      setSelectedStation(null)
                      setSelectedBlock(null)
                    }}
                  >
                    <circle
                      r="12"
                      fill={t.type === 'EXPRESS' ? '#2563eb' : '#10b981'}
                      opacity="0.3"
                      className="animate-pulse"
                    />

                    <rect
                      x="-14"
                      y="-8"
                      width="28"
                      height="16"
                      rx="4"
                      fill={isSelected ? '#f59e0b' : t.type === 'EXPRESS' ? '#1d4ed8' : '#059669'}
                      stroke="#ffffff"
                      strokeWidth="1.5"
                      className="shadow-md"
                    />

                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {t.direction === 'DOWN' ? '▶' : '◀'}
                    </text>

                    <rect
                      x="-22"
                      y="-22"
                      width="44"
                      height="12"
                      rx="2"
                      fill="#0f172a"
                      opacity="0.85"
                    />
                    <text
                      x="0"
                      y="-13"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {t.number}
                    </text>
                  </g>
                )
              })}
        </svg>

        {/* Selected Item Slide-out Inspector Card */}
        {(selectedStation || selectedTrain || selectedBlock) && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-500" />
                Telemetry Inspector
              </span>
              <button
                onClick={() => {
                  setSelectedStation(null)
                  setSelectedTrain(null)
                  setSelectedBlock(null)
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Station Inspection View */}
            {selectedStation && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedStation.name} ({selectedStation.code})
                  </span>
                  <Badge variant={selectedStation.hasJunction ? 'info' : 'neutral'}>
                    {selectedStation.hasJunction ? 'Junction Hub' : 'Wayside Station'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Kilometer Post</span>
                    <p className="font-mono font-bold mt-0.5">{selectedStation.km} km</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Platforms</span>
                    <p className="font-mono font-bold mt-0.5">{selectedStation.platforms} Running Lines</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Signal Aspect</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {selectedStation.signalAspect} CLEAR
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Interlocking</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Electronic Route Relay</p>
                  </div>
                </div>
              </div>
            )}

            {/* Train Inspection View */}
            {selectedTrain && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                      {selectedTrain.number} - {selectedTrain.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Section: {selectedTrain.currentSection}
                    </span>
                  </div>
                  <Badge variant={selectedTrain.status === 'ON_TIME' ? 'success' : 'danger'}>
                    {selectedTrain.status === 'ON_TIME' ? 'ON TIME' : `+${selectedTrain.delayMinutes}m`}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Speed Telemetry</span>
                    <p className="font-mono font-bold mt-0.5 text-blue-600 dark:text-blue-400">
                      {Math.round(selectedTrain.speedKmph)} km/h
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Direction</span>
                    <p className="font-mono font-bold mt-0.5">{selectedTrain.direction} Line Bound</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Train Category</span>
                    <p className="font-bold mt-0.5">{selectedTrain.type}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Track Circuit</span>
                    <p className="font-mono font-bold text-emerald-600 mt-0.5">TC-{selectedTrain.number.slice(-3)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Block Inspection View */}
            {selectedBlock && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {selectedBlock.code} (Possession)
                  </span>
                  <Badge variant="warning">{selectedBlock.department} Block</Badge>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-medium">{selectedBlock.reason}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Span Location</span>
                    <p className="font-mono font-bold mt-0.5">Km {selectedBlock.fromKm} - {selectedBlock.toKm}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Remaining Window</span>
                    <p className="font-mono font-bold text-amber-600 mt-0.5">{selectedBlock.remainingMins} mins</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg flex flex-wrap items-center gap-4 text-[10px] text-slate-600 dark:text-slate-400 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span>Passenger Express</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Freight Goods</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-red-500 inline-block" />
            <span>Active Possession Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Signal Clear</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RailwayCorridorMap
