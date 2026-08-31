import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '../../components/ui/PageHeader'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { trainService } from '../../services/trains'
import { Search } from 'lucide-react'

export const TrainList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  // Debounce search
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const { data: trainsData, isLoading } = useQuery({
    queryKey: ['trains', { search: debouncedSearch, status: statusFilter, train_type: typeFilter, page_size: 100 }],
    queryFn: () => trainService.getTrains({ 
      search: debouncedSearch, 
      status: statusFilter, 
      train_type: typeFilter, 
      page_size: 100 
    }),
  })

  const trains = trainsData?.data?.items || []

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Trains"
        subtitle="Manage and monitor all trains on the network"
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Trains', href: '/trains' },
          { label: 'List' },
        ]}
      />

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-sm font-medium flex items-center justify-center">
        DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search train number or name..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select 
          className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="APPROACHING">Approaching</option>
          <option value="AT_STATION">At Station</option>
          <option value="DEPARTED">Departed</option>
          <option value="DELAYED">Delayed</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select 
          className="h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="PASSENGER">Passenger</option>
          <option value="EXPRESS">Express</option>
          <option value="SUPERFAST">Superfast</option>
          <option value="GOODS">Goods</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Train No</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Route</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Loading trains...
                  </td>
                </tr>
              ) : trains.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No trains found matching criteria
                  </td>
                </tr>
              ) : (
                trains.map(train => (
                  <tr key={train.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                      {train.train_number}
                    </td>
                    <td className="px-6 py-4 font-medium">{train.train_name}</td>
                    <td className="px-6 py-4">
                      <Badge variant="neutral">{train.train_type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {train.origin} <span className="mx-1">→</span> {train.destination}
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/trains/${train.id}`}>
                        <Button variant="outline" size="sm">Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TrainList
