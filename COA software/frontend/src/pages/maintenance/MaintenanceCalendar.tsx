import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { maintenanceService } from '../../services/maintenance'
import { Link } from 'react-router-dom'

export const MaintenanceCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())

  // For this prototype, we'll fetch a broad range of tasks and filter them on the client.
  // In a real app with large data, we would pass date_from and date_to parameters to the API.
  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance', 'calendar'],
    queryFn: () => maintenanceService.getTasks({ page_size: 100 }), // Fetching up to 100 for calendar view Demo
  })

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const today = () => setCurrentDate(new Date())

  const getTasksForDate = (day: number) => {
    if (!data?.data?.items) return []
    return data.data.items.filter(task => {
      if (!task.scheduled_start_at) return false
      const taskDate = new Date(task.scheduled_start_at)
      return taskDate.getDate() === day &&
             taskDate.getMonth() === currentDate.getMonth() &&
             taskDate.getFullYear() === currentDate.getFullYear()
    })
  }

  const renderCalendarDays = () => {
    const days = []
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[100px] border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 rounded-lg" />)
    }

    // Cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === new Date().getDate() && 
                      currentDate.getMonth() === new Date().getMonth() && 
                      currentDate.getFullYear() === new Date().getFullYear()
      
      const dayTasks = getTasksForDate(day)

      days.push(
        <div 
          key={day} 
          className={`min-h-[120px] p-2 border rounded-lg transition-colors
            ${isToday 
              ? 'border-blue-300 dark:border-blue-800/50 bg-blue-50/30 dark:bg-blue-900/10' 
              : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-700 bg-white dark:bg-slate-900'
            }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-semibold w-6 h-6 flex items-center justify-center rounded-full
              ${isToday ? 'bg-blue-500 text-white' : 'text-slate-700 dark:text-slate-300'}`}
            >
              {day}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-[10px] font-mono text-slate-400">{dayTasks.length} tasks</span>
            )}
          </div>
          
          <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1 custom-scrollbar">
            {dayTasks.map(task => (
              <Link 
                key={task.id} 
                to={`/maintenance/tasks/${task.id}`}
                className={`block text-[10px] p-1.5 rounded truncate border transition-colors
                  ${task.priority === 'CRITICAL' ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:border-red-400' :
                    task.priority === 'HIGH' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:border-amber-400' :
                    'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                title={task.description}
              >
                <span className="font-bold mr-1">{task.department}</span>
                {task.task_code}
              </Link>
            ))}
          </div>
        </div>
      )
    }

    return days
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Calendar"
        subtitle="Month-view scheduling map for all department work orders."
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: 'Maintenance', href: '/maintenance' },
          { label: 'Calendar' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={today}>
              Today
            </Button>
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-4 py-1.5 text-sm font-semibold bg-slate-50 dark:bg-slate-900 min-w-[120px] text-center border-x border-slate-200 dark:border-slate-700">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-[600px] flex items-center justify-center">
              <span className="text-slate-400">Loading schedule...</span>
            </div>
          ) : error ? (
            <div className="h-[600px] flex items-center justify-center text-red-500">
              Failed to load calendar data.
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {renderCalendarDays()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MaintenanceCalendar
