import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Train as TrainIcon, 
  Activity, 
  Clock, 
  Package, 
  Users, 
  MapPin,
  RefreshCw,
  ArrowRight
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { RailwayCorridorMap } from '../../components/map/RailwayCorridorMap'
import { trainService } from '../../services/trains'

export const TrainOperationsDashboard: React.FC = () => {
  const queryClient = useQueryClient()

  const { data: trainsData, isLoading: trainsLoading } = useQuery({
    queryKey: ['trains', { page_size: 100 }],
    queryFn: () => trainService.getTrains({ page_size: 100 }),
  })

  const syncMutation = useMutation({
    mutationFn: () => trainService.syncCOA(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trains'] })
    }
  })

  const trains = trainsData?.data?.items || []

  const totalTrains = trains.length
  const activeTrainsList = trains.filter(t => ['APPROACHING', 'AT_STATION', 'DEPARTED', 'DELAYED'].includes(t.status))
  const activeTrains = activeTrainsList.length
  const delayedTrains = trains.filter(t => t.status === 'DELAYED').length
  const goodsTrains = trains.filter(t => t.is_goods_train || t.train_type === 'GOODS').length
  const passengerTrains = trains.filter(t => t.is_passenger_train || ['PASSENGER', 'EXPRESS', 'SUPERFAST'].includes(t.train_type)).length

  // Quick corridor high-traffic approximation
  const corridorCount: Record<string, number> = {}
  trains.forEach(t => {
    if (t.corridor_id) {
      corridorCount[t.corridor_id] = (corridorCount[t.corridor_id] || 0) + 1
    }
  })
  const highTrafficCorridors = Object.values(corridorCount).filter(count => count >= 2).length

  // List of trains to show in the Recent Active Trains card
  const displayTrains = activeTrainsList.length > 0 ? activeTrainsList.slice(0, 6) : trains.slice(0, 6)

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral' => {
    switch (status) {
      case 'DEPARTED':
        return 'success'
      case 'AT_STATION':
        return 'purple'
      case 'APPROACHING':
        return 'info'
      case 'DELAYED':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Train Operations"
        subtitle="Operational train movement and timetable intelligence"
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Trains' },
        ]}
        actions={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => syncMutation.mutate()} 
              disabled={syncMutation.isPending}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              COA Sync
            </Button>
            <Link to="/trains/list">
              <Button variant="primary" size="sm">
                View All Trains
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-3 mb-6 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-medium flex items-center justify-center">
        DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Trains"
          value={trainsLoading ? '-' : totalTrains}
          trend="neutral"
          icon={<TrainIcon className="w-4 h-4" />}
          status="default"
        />
        <MetricCard
          title="Active Trains"
          value={trainsLoading ? '-' : activeTrains}
          trend="up"
          icon={<Activity className="w-4 h-4" />}
          status="info"
        />
        <MetricCard
          title="Delayed Trains"
          value={trainsLoading ? '-' : delayedTrains}
          trend={delayedTrains > 0 ? "up" : "down"}
          icon={<Clock className="w-4 h-4" />}
          status={delayedTrains > 0 ? "danger" : "success"}
        />
        <MetricCard
          title="Goods Trains"
          value={trainsLoading ? '-' : goodsTrains}
          trend="neutral"
          icon={<Package className="w-4 h-4" />}
          status="warning"
        />
        <MetricCard
          title="Passenger Trains"
          value={trainsLoading ? '-' : passengerTrains}
          trend="neutral"
          icon={<Users className="w-4 h-4" />}
          status="default"
        />
        <MetricCard
          title="High Traffic Corridors"
          value={trainsLoading ? '-' : highTrafficCorridors}
          trend="up"
          icon={<MapPin className="w-4 h-4" />}
          status="warning"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Recent Active Trains ({displayTrains.length})
            </CardTitle>
            <Link to="/trains/list" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {trainsLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : displayTrains.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No active trains currently on network.
              </div>
            ) : (
              <div className="space-y-3">
                {displayTrains.map(t => (
                  <Link 
                    key={t.id} 
                    to={`/trains/${t.id}`} 
                    className="block p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all hover:border-blue-300 dark:hover:border-blue-700 shadow-xs"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400">
                            #{t.train_number}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {t.train_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{t.origin}</span>
                          <span>→</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{t.destination}</span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-medium uppercase">
                            {t.train_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={getStatusBadgeVariant(t.status)} size="sm" dot>
                          {t.status}
                        </Badge>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Priority {t.priority} {t.priority === 1 && <span className="text-amber-500 font-bold">★</span>}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Corridor Overview & Live GIS Map</CardTitle>
            <Link to="/corridors/map" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Open Full GIS Map →
            </Link>
          </CardHeader>
          <CardContent className="p-0 sm:p-2">
            <RailwayCorridorMap height="380px" showControls={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TrainOperationsDashboard
