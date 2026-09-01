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
  RefreshCw
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { MetricCard } from '../../components/ui/MetricCard'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
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
  const activeTrains = trains.filter(t => ['APPROACHING', 'AT_STATION', 'DEPARTED'].includes(t.status)).length
  const delayedTrains = trains.filter(t => t.status === 'DELAYED').length
  const goodsTrains = trains.filter(t => t.is_goods_train).length
  const passengerTrains = trains.filter(t => t.is_passenger_train).length

  // Quick corridor high-traffic approximation
  const corridorCount: Record<string, number> = {}
  trains.forEach(t => {
    if (t.corridor_id) {
      corridorCount[t.corridor_id] = (corridorCount[t.corridor_id] || 0) + 1
    }
  })
  const highTrafficCorridors = Object.values(corridorCount).filter(count => count >= 4).length

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
          <CardHeader>
            <CardTitle>Recent Active Trains</CardTitle>
          </CardHeader>
          <CardContent>
            {trainsLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : activeTrains === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-500">
                No active trains currently on network.
              </div>
            ) : (
              <div className="space-y-4">
                {trains.filter(t => ['APPROACHING', 'AT_STATION', 'DEPARTED'].includes(t.status)).slice(0, 5).map(t => (
                  <Link key={t.id} to={`/trains/${t.id}`} className="block p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">{t.train_number} - {t.train_name}</div>
                        <div className="text-sm text-slate-500 mt-1">
                          {t.origin} → {t.destination} | {t.train_type}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{t.status}</div>
                        <div className="text-xs text-slate-500 mt-1">Priority: {t.priority}</div>
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
            <RailwayCorridorMap height="360px" showControls={true} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TrainOperationsDashboard
