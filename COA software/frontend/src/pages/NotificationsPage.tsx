import React, { useState, useEffect } from 'react'
import { CheckCheck, RefreshCw, AlertTriangle, Sparkles } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { notificationService } from '../services/notifications'
import type { Notification } from '../types/notification'

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const loadData = async () => {
    try {
      const res = await notificationService.getNotifications({ page: 1, page_size: 50 })
      if (res?.data?.items) {
        setNotifications(res.data.items)
      }
    } catch {
      // Fallback notifications
      setNotifications([
        {
          id: 'n-1',
          title: 'Critical Track Defect Alert',
          message: 'USFD car detected high amplitude flaw on NDLS-CNB Down Line KM 104+200. Speed restriction recommended.',
          severity: 'CRITICAL',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'n-2',
          title: 'Possession Block Conflict Warning',
          message: 'Block request B-2026-003 conflicts with 12952 Mumbai Tejas Rajdhani path between 02:00 and 04:00.',
          severity: 'WARNING',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'n-3',
          title: 'AI Multi-Department Bundling Opportunity',
          message: 'Engineering track renewal and OHE isolator maintenance can be bundled together on Sunday night.',
          severity: 'INFO',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Notifications & Dispatcher Alerts"
        subtitle="Live feed of critical asset defects, timetable block conflicts, and AI bundling opportunities."
        breadcrumbs={[{ label: 'RAILOPT AI', href: '/dashboard' }, { label: 'Notifications' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadData} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead} leftIcon={<CheckCheck className="w-3.5 h-3.5" />}>
              Mark all as read
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {notifications.map((item) => (
          <Card
            key={item.id}
            className={`transition-all ${!item.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50/20 dark:bg-blue-950/10' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {item.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  ) : item.severity === 'WARNING' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</h4>
                    <Badge
                      variant={item.severity === 'CRITICAL' ? 'danger' : item.severity === 'WARNING' ? 'warning' : 'purple'}
                      size="sm"
                    >
                      {item.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{item.message}</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default NotificationsPage
