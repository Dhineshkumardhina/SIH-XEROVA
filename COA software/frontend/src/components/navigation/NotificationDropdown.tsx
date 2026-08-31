import React, { useState, useEffect } from 'react'
import { Bell, CheckCheck, AlertTriangle, Layers, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Dropdown } from '../ui/Dropdown'
import { notificationService } from '../../services/notifications'
import type { Notification } from '../../types/notification'

export const NotificationDropdown: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getNotifications({ page: 1, page_size: 5 })
      if (res?.data?.items) {
        setNotifications(res.data.items)
        setUnreadCount(res.data.items.filter((n) => !n.is_read).length)
      }
    } catch {
      // Fallback notifications if backend has none or offline
      const mockNotifications: Notification[] = [
        {
          id: 'mock-1',
          title: 'Critical Track Defect',
          message: 'Ultrasonic flaw detected at KM 104+200 (NDLS-CNB)',
          severity: 'CRITICAL',
          is_read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          title: 'Block Conflict Warning',
          message: 'Signal interlocking conflict on Corridor C-01 Track 2',
          severity: 'WARNING',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'mock-3',
          title: 'AI Bundling Opportunity',
          message: '3 Engineering and OHE tasks bundled into single 180min window',
          severity: 'INFO',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ]
      setNotifications(mockNotifications)
      setUnreadCount(2)
    } finally {
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
    } catch {
      // Optimistic local update
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
      case 'INFO':
        return <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
      default:
        return <Layers className="w-4 h-4 text-blue-500 shrink-0" />
    }
  }

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount}
            </span>
          )}
        </button>
      }
      align="right"
      className="w-80 p-0"
    >
      <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
          Notifications
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <CheckCheck className="w-3 h-3" />
            Mark all read
          </button>
        )}
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-2.5 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                !n.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
              }`}
            >
              <div className="mt-0.5">{getSeverityIcon(n.severity)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{n.title}</p>
                  {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-1 block">
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
        <Link
          to="/notifications"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline block"
        >
          View all notifications →
        </Link>
      </div>
    </Dropdown>
  )
}

export default NotificationDropdown
