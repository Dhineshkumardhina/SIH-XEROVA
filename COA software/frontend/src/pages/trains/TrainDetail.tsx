import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'
import { trainService } from '../../services/trains'

export const TrainDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const { data: trainData, isLoading: trainLoading } = useQuery({
    queryKey: ['train', id],
    queryFn: () => trainService.getTrainById(id!),
    enabled: !!id
  })

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery({
    queryKey: ['train_schedule', id],
    queryFn: () => trainService.getTrainSchedule(id!, { page_size: 100 }),
    enabled: !!id
  })

  const { data: movementData, isLoading: movementLoading } = useQuery({
    queryKey: ['train_movements', id],
    queryFn: () => trainService.getTrainMovements(id!, { page_size: 100 }),
    enabled: !!id
  })

  const train = trainData?.data
  const schedules = scheduleData?.data?.items || []
  const movements = movementData?.data?.items || []

  if (trainLoading) {
    return (
      <div className="space-y-6 pb-20">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!train) {
    return (
      <div className="p-12 text-center text-slate-500">
        Train not found.
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={`${train.train_number} - ${train.train_name}`}
        subtitle={`${train.origin} to ${train.destination}`}
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Trains', href: '/trains' },
          { label: train.train_number },
        ]}
        actions={
          <Badge 
            variant={
              train.status === 'DELAYED' ? 'danger' :
              ['APPROACHING', 'AT_STATION', 'DEPARTED'].includes(train.status) ? 'info' :
              train.status === 'COMPLETED' ? 'success' :
              'neutral'
            }
          >
            {train.status}
          </Badge>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500 font-semibold uppercase">Type</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{train.train_type}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 font-semibold uppercase">Priority Level</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{train.priority}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 font-semibold uppercase">Max Speed</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{train.max_speed_kmh} km/h</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 font-semibold uppercase">Length</div>
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{train.length_meters || '-'} m</div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timetable & Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No schedule stops found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Seq</th>
                    <th className="px-4 py-3">Station</th>
                    <th className="px-4 py-3">Arrival</th>
                    <th className="px-4 py-3">Departure</th>
                    <th className="px-4 py-3">Platform</th>
                    <th className="px-4 py-3">Halt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {schedules.map((stop) => (
                    <tr key={stop.id}>
                      <td className="px-4 py-3 font-mono">{stop.stop_sequence}</td>
                      <td className="px-4 py-3 font-medium">{stop.station_id || '-'}</td>
                      <td className="px-4 py-3 font-mono">{stop.arrival_time || '-'}</td>
                      <td className="px-4 py-3 font-mono">{stop.departure_time || '-'}</td>
                      <td className="px-4 py-3">{stop.platform || '-'}</td>
                      <td className="px-4 py-3">{stop.halt_duration_minutes ? `${stop.halt_duration_minutes} min` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Movements</CardTitle>
        </CardHeader>
        <CardContent>
          {movementLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : movements.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No movement history available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Station</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Delay (min)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {movements.map((mov) => (
                    <tr key={mov.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {new Date(mov.event_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium">{mov.event_type}</td>
                      <td className="px-4 py-3">{mov.station_id || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={mov.status === 'DELAYED' ? 'danger' : 'neutral'}>
                          {mov.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{mov.delay_minutes || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default TrainDetail
