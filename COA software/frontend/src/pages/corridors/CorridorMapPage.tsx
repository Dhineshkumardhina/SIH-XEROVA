import React, { useState } from 'react'
import { PageHeader } from '../../components/ui/PageHeader'
import { RailwayCorridorMap } from '../../components/map/RailwayCorridorMap'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Zap, ShieldCheck, Activity, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export const CorridorMapPage: React.FC = () => {
  const [selectedCorridor, setSelectedCorridor] = useState<string>('cor-001')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interactive Corridor Topology & GIS Track Map"
        subtitle="Live schematic railway interlocking, multi-track geometry, signal aspect status, kilometer post markers, and dynamic train density."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Corridors', href: '/corridors' },
          { label: 'GIS Topology Map' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync Telemetry
            </Button>
          </div>
        }
      />

      {/* Main Interactive Map Canvas */}
      <RailwayCorridorMap
        height="560px"
        selectedCorridorId={selectedCorridor}
        onSelectCorridor={setSelectedCorridor}
        showControls={true}
      />

      {/* Corridor Quick Diagnostics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Section Line Density</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">88.4%</div>
            <p className="text-xs text-slate-500 mt-1">
              Peak traffic load on NDLS-CNB Quad Track section (44 trains / 24h).
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="warning">High Density Corridor</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Traction & Electrification</span>
              <Zap className="w-4 h-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100% Electrified</div>
            <p className="text-xs text-slate-500 mt-1">
              25kV AC overhead catenary feeder with dual-circuit substations at 45km intervals.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="success">OHE Normal</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Safety & Interlocking</span>
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">Automatic Block</div>
            <p className="text-xs text-slate-500 mt-1">
              4-Aspect Electronic Interlocking with continuous track circuits and Kavach TCAS compliance.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="info">Kavach Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default CorridorMapPage
