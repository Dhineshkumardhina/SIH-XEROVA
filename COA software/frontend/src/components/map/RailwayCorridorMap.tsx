import React, { useState, useEffect, useRef } from 'react'
import L from 'leaflet'
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
  Globe,
  Sliders
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

interface GeoStation {
  id: string
  code: string
  name: string
  km: number
  lat: number
  lng: number
  platforms: number
  hasJunction: boolean
  signalAspect: 'GREEN' | 'YELLOW' | 'DOUBLE_YELLOW' | 'RED'
  schematicX: number
  schematicY: number
}

interface GeoCorridor {
  id: string
  code: string
  name: string
  distanceKm: number
  trackCount: number
  electrified: boolean
  density: 'LOW' | 'NORMAL' | 'HIGH' | 'CONGESTED'
  availabilityPct: number
  center: [number, number]
  zoom: number
  stations: GeoStation[]
  schematicPathD: string
}

interface LiveTrainMarker {
  id: string
  number: string
  name: string
  type: 'PASSENGER' | 'EXPRESS' | 'FREIGHT' | 'SPECIAL'
  corridorId: string
  progress: number // 0 to 100%
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
  fromStationCode: string
  toStationCode: string
  durationMins: number
  remainingMins: number
  reason: string
}

// Indian Railways Real GPS GIS Corridors Data
const CORRIDORS_GIS_DATA: GeoCorridor[] = [
  {
    id: 'cor-001',
    code: 'COR-A01',
    name: 'NDLS - CNB - PRYJ - DDU Main Trunk',
    distanceKm: 750,
    trackCount: 4,
    electrified: true,
    density: 'HIGH',
    availabilityPct: 94.8,
    center: [26.85, 80.1],
    zoom: 7,
    schematicPathD: 'M 80 180 C 220 160, 360 210, 500 220 C 640 230, 780 270, 920 290',
    stations: [
      { id: 'st-01', code: 'NDLS', name: 'New Delhi', km: 0, lat: 28.6139, lng: 77.2090, platforms: 16, hasJunction: true, signalAspect: 'GREEN', schematicX: 80, schematicY: 180 },
      { id: 'st-02', code: 'GZB', name: 'Ghaziabad Jn', km: 28, lat: 28.6692, lng: 77.4538, platforms: 6, hasJunction: true, signalAspect: 'GREEN', schematicX: 190, schematicY: 170 },
      { id: 'st-03', code: 'ALJN', name: 'Aligarh Jn', km: 131, lat: 27.8974, lng: 78.0880, platforms: 7, hasJunction: false, signalAspect: 'YELLOW', schematicX: 320, schematicY: 195 },
      { id: 'st-04', code: 'TDL', name: 'Tundla Jn', km: 209, lat: 27.2091, lng: 78.2435, platforms: 5, hasJunction: true, signalAspect: 'GREEN', schematicX: 450, schematicY: 215 },
      { id: 'st-05', code: 'CNB', name: 'Kanpur Central', km: 440, lat: 26.4499, lng: 80.3319, platforms: 10, hasJunction: true, signalAspect: 'DOUBLE_YELLOW', schematicX: 600, schematicY: 228 },
      { id: 'st-06', code: 'PRYJ', name: 'Prayagraj Jn', km: 635, lat: 25.4358, lng: 81.8463, platforms: 10, hasJunction: true, signalAspect: 'GREEN', schematicX: 760, schematicY: 260 },
      { id: 'st-07', code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya', km: 750, lat: 25.2818, lng: 83.1189, platforms: 8, hasJunction: true, signalAspect: 'GREEN', schematicX: 920, schematicY: 290 },
    ],
  },
  {
    id: 'cor-002',
    code: 'COR-B02',
    name: 'DER - RE - FL Western Dedicated Freight Trunk',
    distanceKm: 640,
    trackCount: 2,
    electrified: true,
    density: 'CONGESTED',
    availabilityPct: 91.2,
    center: [26.4, 75.3],
    zoom: 7,
    schematicPathD: 'M 100 380 C 260 340, 420 380, 580 400 C 720 420, 830 450, 910 490',
    stations: [
      { id: 'st-08', code: 'DER', name: 'Dadri DFC Yard', km: 0, lat: 28.5529, lng: 77.5544, platforms: 4, hasJunction: true, signalAspect: 'GREEN', schematicX: 100, schematicY: 380 },
      { id: 'st-09', code: 'RE', name: 'Rewari Jn', km: 82, lat: 28.1920, lng: 76.6191, platforms: 8, hasJunction: true, signalAspect: 'GREEN', schematicX: 300, schematicY: 355 },
      { id: 'st-10', code: 'FL', name: 'Phulera Jn', km: 290, lat: 26.8741, lng: 75.2384, platforms: 5, hasJunction: true, signalAspect: 'RED', schematicX: 520, schematicY: 390 },
      { id: 'st-11', code: 'AII', name: 'Ajmer Jn', km: 374, lat: 26.4499, lng: 74.6399, platforms: 6, hasJunction: true, signalAspect: 'YELLOW', schematicX: 710, schematicY: 425 },
      { id: 'st-12', code: 'PNU', name: 'Palanpur Jn', km: 640, lat: 24.1724, lng: 72.4346, platforms: 4, hasJunction: true, signalAspect: 'GREEN', schematicX: 910, schematicY: 490 },
    ],
  },
  {
    id: 'cor-003',
    code: 'COR-C03',
    name: 'BPQ - RDM - KZJ - SC Southern Spine',
    distanceKm: 480,
    trackCount: 2,
    electrified: true,
    density: 'NORMAL',
    availabilityPct: 97.4,
    center: [18.6, 79.0],
    zoom: 7,
    schematicPathD: 'M 120 490 C 300 470, 480 490, 640 480 C 760 470, 840 450, 900 430',
    stations: [
      { id: 'st-13', code: 'BPQ', name: 'Balharshah Jn', km: 0, lat: 19.8542, lng: 79.3789, platforms: 5, hasJunction: true, signalAspect: 'GREEN', schematicX: 120, schematicY: 490 },
      { id: 'st-14', code: 'RDM', name: 'Ramagundam', km: 142, lat: 18.7561, lng: 79.5132, platforms: 3, hasJunction: false, signalAspect: 'GREEN', schematicX: 380, schematicY: 480 },
      { id: 'st-15', code: 'KZJ', name: 'Kazipet Jn', km: 235, lat: 17.9784, lng: 79.5218, platforms: 4, hasJunction: true, signalAspect: 'GREEN', schematicX: 620, schematicY: 482 },
      { id: 'st-16', code: 'SC', name: 'Secunderabad Jn', km: 480, lat: 17.4399, lng: 78.4983, platforms: 10, hasJunction: true, signalAspect: 'GREEN', schematicX: 900, schematicY: 430 },
    ],
  },
]

const INITIAL_TRAINS: LiveTrainMarker[] = [
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
    fromStationCode: 'ALJN',
    toStationCode: 'TDL',
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
    fromStationCode: 'FL',
    toStationCode: 'AII',
    durationMins: 90,
    remainingMins: 70,
    reason: '25kV Feeder Wire & Catenary Tensioning',
  },
]

export const RailwayCorridorMap: React.FC<RailwayCorridorMapProps> = ({
  height = '520px',
  selectedCorridorId = 'cor-001',
  onSelectCorridor,
  showControls = true,
  className,
}) => {
  const [activeCorridorId, setActiveCorridorId] = useState<string>(selectedCorridorId)
  const [mapMode, setMapMode] = useState<'SCHEMATIC' | 'GEOGRAPHIC'>('GEOGRAPHIC')
  const [gisTileStyle, setGisTileStyle] = useState<'VOYAGER' | 'SATELLITE' | 'DARK' | 'OSM'>('VOYAGER')

  // Schematic Pan/Zoom state
  const [schematicZoom, setSchematicZoom] = useState<number>(1)
  const [schematicPan, setSchematicPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Layer Toggles
  const [showTrains, setShowTrains] = useState(true)
  const [showBlocks, setShowBlocks] = useState(true)
  const [showSignals, setShowSignals] = useState(true)

  // Inspection Selection
  const [selectedStation, setSelectedStation] = useState<GeoStation | null>(null)
  const [selectedTrain, setSelectedTrain] = useState<LiveTrainMarker | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<ActiveBlockOverlay | null>(null)

  const [trains, setTrains] = useState<LiveTrainMarker[]>(INITIAL_TRAINS)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const leafletMapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null)

  // Animation Loop for Live Moving Trains
  useEffect(() => {
    const timer = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => {
          const step = (t.speedKmph / 120) * 0.4
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

  const activeCorridor = CORRIDORS_GIS_DATA.find((c) => c.id === activeCorridorId) || CORRIDORS_GIS_DATA[0]

  const handleSelectCorridor = (id: string) => {
    setActiveCorridorId(id)
    setSelectedStation(null)
    setSelectedTrain(null)
    setSelectedBlock(null)
    if (onSelectCorridor) onSelectCorridor(id)

    const targetCorridor = CORRIDORS_GIS_DATA.find((c) => c.id === id)
    if (targetCorridor && leafletMapInstanceRef.current) {
      leafletMapInstanceRef.current.flyTo(targetCorridor.center, targetCorridor.zoom, { duration: 1.2 })
    }
  }

  // Calculate coordinates for a train given progress along corridor GPS track
  const getTrainGeoCoordinates = (corridor: GeoCorridor, progress: number): [number, number] => {
    const stations = corridor.stations
    if (stations.length < 2) return [stations[0].lat, stations[0].lng]
    const segment = (progress / 100) * (stations.length - 1)
    const idx = Math.min(Math.floor(segment), stations.length - 2)
    const t = segment - idx
    const s1 = stations[idx]
    const s2 = stations[idx + 1]
    return [
      s1.lat + (s2.lat - s1.lat) * t,
      s1.lng + (s2.lng - s1.lng) * t
    ]
  }

  const getTrainSchematicCoordinates = (corridor: GeoCorridor, progress: number) => {
    const stations = corridor.stations
    if (stations.length < 2) return { x: 100, y: 200 }
    const segment = (progress / 100) * (stations.length - 1)
    const idx = Math.min(Math.floor(segment), stations.length - 2)
    const t = segment - idx
    const s1 = stations[idx]
    const s2 = stations[idx + 1]
    return {
      x: s1.schematicX + (s2.schematicX - s1.schematicX) * t,
      y: s1.schematicY + (s2.schematicY - s1.schematicY) * t
    }
  }

  // Initialize Leaflet GIS Map
  useEffect(() => {
    if (mapMode !== 'GEOGRAPHIC' || !mapContainerRef.current) return

    if (!leafletMapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: activeCorridor.center,
        zoom: activeCorridor.zoom,
        zoomControl: false,
        attributionControl: false
      })

      // Add Base Tile Layer
      const getTileUrl = (style: string) => {
        switch (style) {
          case 'SATELLITE':
            return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          case 'DARK':
            return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          case 'OSM':
            return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          default:
            return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        }
      }

      const tileLayer = L.tileLayer(getTileUrl(gisTileStyle), {
        maxZoom: 18,
        subdomains: 'abcd'
      }).addTo(map)

      tileLayerRef.current = tileLayer
      markersLayerGroupRef.current = L.layerGroup().addTo(map)
      leafletMapInstanceRef.current = map

      // Invalidate size on load
      setTimeout(() => {
        map.invalidateSize()
      }, 200)
    }

    return () => {
      // Clean up map instance when component unmounts or mode changes
      if (leafletMapInstanceRef.current && mapMode !== 'GEOGRAPHIC') {
        leafletMapInstanceRef.current.remove()
        leafletMapInstanceRef.current = null
      }
    }
  }, [mapMode])

  // Update Base Tile Layer Style
  useEffect(() => {
    if (!leafletMapInstanceRef.current || !tileLayerRef.current) return
    const getTileUrl = (style: string) => {
      switch (style) {
        case 'SATELLITE':
          return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        case 'DARK':
          return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        case 'OSM':
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        default:
          return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
      }
    }
    tileLayerRef.current.setUrl(getTileUrl(gisTileStyle))
  }, [gisTileStyle])

  // Render Leaflet Overlays (Corridor Lines, Stations, Trains, Blocks)
  useEffect(() => {
    if (mapMode !== 'GEOGRAPHIC' || !leafletMapInstanceRef.current || !markersLayerGroupRef.current) return

    const layerGroup = markersLayerGroupRef.current
    layerGroup.clearLayers()

    // 1. Draw All Corridors Track Polylines
    CORRIDORS_GIS_DATA.forEach((corridor) => {
      const isSelected = corridor.id === activeCorridorId
      const latLngs = corridor.stations.map((st) => [st.lat, st.lng] as [number, number])

      // Outer track glow
      L.polyline(latLngs, {
        color: isSelected ? '#3b82f6' : '#94a3b8',
        weight: isSelected ? 8 : 4,
        opacity: isSelected ? 0.35 : 0.2
      }).addTo(layerGroup)

      // Main Railway Line
      L.polyline(latLngs, {
        color: isSelected ? '#1d4ed8' : '#64748b',
        weight: isSelected ? 4 : 2.5,
        opacity: 0.9
      }).addTo(layerGroup)

      // Railway Cross-Tie Dash
      L.polyline(latLngs, {
        color: '#ffffff',
        weight: isSelected ? 2 : 1.5,
        dashArray: '2, 8',
        opacity: 0.95
      }).addTo(layerGroup)
    })

    // 2. Draw Active Maintenance Block Zones
    if (showBlocks) {
      ACTIVE_BLOCKS.forEach((blk) => {
        const corr = CORRIDORS_GIS_DATA.find((c) => c.id === blk.corridorId)
        if (!corr) return
        const fromSt = corr.stations.find((s) => s.code === blk.fromStationCode) || corr.stations[1]
        const toSt = corr.stations.find((s) => s.code === blk.toStationCode) || corr.stations[2]

        L.polyline([[fromSt.lat, fromSt.lng], [toSt.lat, toSt.lng]], {
          color: '#ef4444',
          weight: 12,
          opacity: 0.5,
          dashArray: '6, 6'
        })
          .addTo(layerGroup)
          .on('click', () => {
            setSelectedBlock(blk)
            setSelectedStation(null)
            setSelectedTrain(null)
          })

        // Warning Icon Marker in middle of block
        const midLat = (fromSt.lat + toSt.lat) / 2
        const midLng = (fromSt.lng + toSt.lng) / 2
        const blockIcon = L.divIcon({
          className: 'custom-block-icon',
          html: `<div style="background-color: #dc2626; color: white; border: 2px solid white; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); animation: pulse 1.5s infinite;">!</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })

        L.marker([midLat, midLng], { icon: blockIcon })
          .addTo(layerGroup)
          .on('click', () => {
            setSelectedBlock(blk)
            setSelectedStation(null)
            setSelectedTrain(null)
          })
      })
    }

    // 3. Draw Station Markers
    activeCorridor.stations.forEach((st) => {
      const signalColor =
        st.signalAspect === 'GREEN'
          ? '#22c55e'
          : st.signalAspect === 'YELLOW' || st.signalAspect === 'DOUBLE_YELLOW'
          ? '#eab308'
          : '#ef4444'

      const stationIcon = L.divIcon({
        className: 'custom-station-icon',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="background: white; border: 2.5px solid #1e293b; border-radius: 50%; width: ${st.hasJunction ? '14px' : '11px'}; height: ${st.hasJunction ? '14px' : '11px'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              <div style="background: #2563eb; border-radius: 50%; width: 5px; height: 5px;"></div>
            </div>
            ${
              showSignals
                ? `<div style="position: absolute; top: -6px; right: -6px; width: 8px; height: 8px; border-radius: 50%; background: ${signalColor}; border: 1.5px solid #0f172a; box-shadow: 0 0 6px ${signalColor};"></div>`
                : ''
            }
            <div style="background: rgba(15, 23, 42, 0.85); color: white; padding: 1px 4px; border-radius: 3px; font-size: 9px; font-weight: 800; font-family: monospace; margin-top: 2px; white-space: nowrap; border: 0.5px solid rgba(255,255,255,0.3); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
              ${st.code}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 7]
      })

      L.marker([st.lat, st.lng], { icon: stationIcon })
        .addTo(layerGroup)
        .on('click', () => {
          setSelectedStation(st)
          setSelectedTrain(null)
          setSelectedBlock(null)
        })
    })

    // 4. Draw Moving Live Trains
    if (showTrains) {
      trains
        .filter((t) => t.corridorId === activeCorridorId)
        .forEach((t) => {
          const [tLat, tLng] = getTrainGeoCoordinates(activeCorridor, t.progress)
          const isSelected = selectedTrain?.id === t.id
          const trainBg = isSelected ? '#f59e0b' : t.type === 'EXPRESS' ? '#1d4ed8' : '#059669'

          const trainIcon = L.divIcon({
            className: 'custom-train-icon',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
                <div style="background: ${trainBg}; color: white; border: 2px solid white; border-radius: 6px; padding: 2px 6px; display: flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 900; font-family: monospace; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">
                  <span>${t.direction === 'DOWN' ? '▶' : '◀'}</span>
                  <span>${t.number}</span>
                </div>
                <div style="width: 2px; height: 6px; background: ${trainBg};"></div>
              </div>
            `,
            iconSize: [60, 30],
            iconAnchor: [30, 28]
          })

          L.marker([tLat, tLng], { icon: trainIcon })
            .addTo(layerGroup)
            .on('click', () => {
              setSelectedTrain(t)
              setSelectedStation(null)
              setSelectedBlock(null)
            })
        })
    }
  }, [activeCorridorId, mapMode, showTrains, showBlocks, showSignals, trains, selectedTrain])

  // Schematic Mode Pan/Zoom Handlers
  const handleSchematicMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - schematicPan.x, y: e.clientY - schematicPan.y })
  }

  const handleSchematicMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setSchematicPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleSchematicMouseUp = () => setIsDragging(false)

  return (
    <div
      className={cn(
        'relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col select-none',
        className
      )}
      style={{ height }}
    >
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-blue-600 text-white shadow-xs">
              <Compass className="w-4 h-4" />
            </span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Railway GIS & Interlocking Map
            </span>
          </div>

          {/* Corridor Selection Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg">
            {CORRIDORS_GIS_DATA.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelectCorridor(c.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer',
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

        {/* Right Tools & Mode Toggle */}
        <div className="flex items-center gap-2">
          {showControls && (
            <>
              {/* Dual Mode Switcher */}
              <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold">
                <button
                  onClick={() => setMapMode('SCHEMATIC')}
                  className={cn(
                    'px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5',
                    mapMode === 'SCHEMATIC'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Schematic
                </button>
                <button
                  onClick={() => setMapMode('GEOGRAPHIC')}
                  className={cn(
                    'px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1.5',
                    mapMode === 'GEOGRAPHIC'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  )}
                >
                  <Globe className="w-3.5 h-3.5" />
                  GIS Geo
                </button>
              </div>

              {/* GIS Base Tile Theme (Visible in Geo Mode) */}
              {mapMode === 'GEOGRAPHIC' && (
                <div className="hidden lg:flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded text-[10px] font-bold">
                  <button
                    onClick={() => setGisTileStyle('VOYAGER')}
                    className={cn(
                      'px-2 py-0.5 rounded cursor-pointer',
                      gisTileStyle === 'VOYAGER' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-500'
                    )}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => setGisTileStyle('SATELLITE')}
                    className={cn(
                      'px-2 py-0.5 rounded cursor-pointer',
                      gisTileStyle === 'SATELLITE' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-500'
                    )}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => setGisTileStyle('DARK')}
                    className={cn(
                      'px-2 py-0.5 rounded cursor-pointer',
                      gisTileStyle === 'DARK' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-500'
                    )}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setGisTileStyle('OSM')}
                    className={cn(
                      'px-2 py-0.5 rounded cursor-pointer',
                      gisTileStyle === 'OSM' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs' : 'text-slate-500'
                    )}
                  >
                    OSM
                  </button>
                </div>
              )}

              {/* Layer Toggles */}
              <div className="hidden md:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
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

              {/* Viewport Zoom & Reset */}
              <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
                <button
                  onClick={() => {
                    if (mapMode === 'GEOGRAPHIC' && leafletMapInstanceRef.current) {
                      leafletMapInstanceRef.current.zoomIn()
                    } else {
                      setSchematicZoom((z) => Math.min(3, z + 0.25))
                    }
                  }}
                  className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (mapMode === 'GEOGRAPHIC' && leafletMapInstanceRef.current) {
                      leafletMapInstanceRef.current.zoomOut()
                    } else {
                      setSchematicZoom((z) => Math.max(0.6, z - 0.25))
                    }
                  }}
                  className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (mapMode === 'GEOGRAPHIC' && leafletMapInstanceRef.current) {
                      leafletMapInstanceRef.current.setView(activeCorridor.center, activeCorridor.zoom)
                    } else {
                      setSchematicZoom(1)
                      setSchematicPan({ x: 0, y: 0 })
                    }
                  }}
                  className="p-1.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                  title="Reset View"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Corridor Summary Ribbon */}
      <div className="px-4 py-1.5 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto">
        <div className="flex items-center gap-4 shrink-0">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {activeCorridor.code}: {activeCorridor.name}
          </span>
          <span>Length: <strong className="text-slate-900 dark:text-slate-100">{activeCorridor.distanceKm} km</strong></span>
          <span>Lines: <strong className="text-slate-900 dark:text-slate-100">{activeCorridor.trackCount} Tracks</strong></span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Zap className="w-3 h-3" /> 25kV OHE Active
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span>Availability: <strong className="text-emerald-600 dark:text-emerald-400">{activeCorridor.availabilityPct}%</strong></span>
          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">
            {mapMode === 'GEOGRAPHIC' ? 'Leaflet Real GIS Tile Engine' : 'Schematic Interlocking View'}
          </span>
        </div>
      </div>

      {/* Main Map Body: Dual Render (Leaflet Real Map vs Schematic SVG) */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* 1. Leaflet Interactive Real GIS Map */}
        <div
          ref={mapContainerRef}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            mapMode === 'GEOGRAPHIC' ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none absolute inset-0'
          )}
        />

        {/* 2. Schematic Interlocking SVG Canvas */}
        {mapMode === 'SCHEMATIC' && (
          <div
            className="w-full h-full bg-slate-50 dark:bg-slate-950 overflow-hidden cursor-grab active:cursor-grabbing"
            onMouseDown={handleSchematicMouseDown}
            onMouseMove={handleSchematicMouseMove}
            onMouseUp={handleSchematicMouseUp}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid meet"
              style={{
                transform: `translate(${schematicPan.x}px, ${schematicPan.y}px) scale(${schematicZoom})`,
                transformOrigin: '50% 50%',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800/60" strokeWidth="0.5" />
                </pattern>
              </defs>

              <rect width="1000" height="600" fill="url(#grid)" />

              {/* Render Corridors Track Schematic */}
              {CORRIDORS_GIS_DATA.map((corridor) => {
                const isSelected = corridor.id === activeCorridorId
                return (
                  <g key={corridor.id} opacity={isSelected ? 1 : 0.35}>
                    <path
                      d={corridor.schematicPathD}
                      fill="none"
                      stroke={isSelected ? '#3b82f6' : '#94a3b8'}
                      strokeWidth={isSelected ? 8 : 4}
                      strokeLinecap="round"
                      opacity={0.3}
                    />
                    <path
                      d={corridor.schematicPathD}
                      fill="none"
                      stroke={isSelected ? '#2563eb' : '#64748b'}
                      strokeWidth={isSelected ? 4 : 2.5}
                      strokeLinecap="round"
                    />
                    <path
                      d={corridor.schematicPathD}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      strokeDasharray="2 6"
                      opacity={0.9}
                    />
                    <text
                      x={corridor.stations[0].schematicX}
                      y={corridor.stations[0].schematicY - 24}
                      fill="currentColor"
                      className="text-[11px] font-black tracking-wider fill-slate-800 dark:fill-slate-200"
                    >
                      {corridor.code}: {corridor.name}
                    </text>
                  </g>
                )
              })}

              {/* Schematic Active Blocks */}
              {showBlocks &&
                ACTIVE_BLOCKS.map((blk) => {
                  if (blk.corridorId !== activeCorridorId && activeCorridorId !== 'all') return null
                  const corr = CORRIDORS_GIS_DATA.find((c) => c.id === blk.corridorId)
                  if (!corr) return null
                  const fromSt = corr.stations.find((s) => s.code === blk.fromStationCode) || corr.stations[1]
                  const toSt = corr.stations.find((s) => s.code === blk.toStationCode) || corr.stations[2]

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
                        x1={fromSt.schematicX}
                        y1={fromSt.schematicY}
                        x2={toSt.schematicX}
                        y2={toSt.schematicY}
                        stroke="#ef4444"
                        strokeWidth="14"
                        strokeLinecap="round"
                        opacity="0.4"
                        className="animate-pulse"
                      />
                      <line
                        x1={fromSt.schematicX}
                        y1={fromSt.schematicY}
                        x2={toSt.schematicX}
                        y2={toSt.schematicY}
                        stroke="#dc2626"
                        strokeWidth="4"
                        strokeDasharray="6 4"
                      />
                      <circle cx={(fromSt.schematicX + toSt.schematicX) / 2} cy={(fromSt.schematicY + toSt.schematicY) / 2} r="10" fill="#dc2626" />
                      <text
                        x={(fromSt.schematicX + toSt.schematicX) / 2}
                        y={(fromSt.schematicY + toSt.schematicY) / 2 + 3.5}
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

              {/* Schematic Stations */}
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
                    <circle cx={st.schematicX} cy={st.schematicY} r="12" fill="#3b82f6" opacity="0.25" className="animate-ping" />
                  )}
                  <circle
                    cx={st.schematicX}
                    cy={st.schematicY}
                    r={st.hasJunction ? 7 : 5.5}
                    fill="#ffffff"
                    stroke="#1e293b"
                    strokeWidth="2.5"
                  />
                  <circle cx={st.schematicX} cy={st.schematicY} r={st.hasJunction ? 3.5 : 2.5} fill="#2563eb" />

                  {showSignals && (
                    <circle
                      cx={st.schematicX + 8}
                      cy={st.schematicY - 8}
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
                    x={st.schematicX}
                    y={st.schematicY + 18}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[10px] font-bold fill-slate-900 dark:fill-slate-100 group-hover:fill-blue-600 transition-colors"
                  >
                    {st.code}
                  </text>
                  <text
                    x={st.schematicX}
                    y={st.schematicY + 28}
                    textAnchor="middle"
                    fill="currentColor"
                    className="text-[8px] font-mono fill-slate-500 dark:fill-slate-400"
                  >
                    Km {st.km}
                  </text>
                </g>
              ))}

              {/* Schematic Live Moving Trains */}
              {showTrains &&
                trains
                  .filter((t) => t.corridorId === activeCorridorId)
                  .map((t) => {
                    const coords = getTrainSchematicCoordinates(activeCorridor, t.progress)
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
                          opacity="0.9"
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
          </div>
        )}

        {/* Slide-out Telemetry Inspector Panel */}
        {(selectedStation || selectedTrain || selectedBlock) && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xl text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-500" />
                Live Telemetry Inspector
              </span>
              <button
                onClick={() => {
                  setSelectedStation(null)
                  setSelectedTrain(null)
                  setSelectedBlock(null)
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Station Inspection */}
            {selectedStation && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {selectedStation.name} ({selectedStation.code})
                  </span>
                  <Badge variant={selectedStation.hasJunction ? 'info' : 'neutral'}>
                    {selectedStation.hasJunction ? 'Junction Hub' : 'Station Node'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">GPS Coordinates</span>
                    <p className="font-mono font-bold mt-0.5">{selectedStation.lat.toFixed(4)}°N, {selectedStation.lng.toFixed(4)}°E</p>
                  </div>
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
                </div>
              </div>
            )}

            {/* Train Inspection */}
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
                    <span className="text-slate-500">Category</span>
                    <p className="font-bold mt-0.5">{selectedTrain.type}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded">
                    <span className="text-slate-500">Kavach TCAS</span>
                    <p className="font-mono font-bold text-emerald-600 mt-0.5">LOCKED 25Hz</p>
                  </div>
                </div>
              </div>
            )}

            {/* Block Inspection */}
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
        <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg flex flex-wrap items-center gap-4 text-[10px] text-slate-600 dark:text-slate-400 select-none">
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
