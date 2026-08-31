import React, { useState, useEffect, useRef } from 'react'
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Shield,
  CheckCheck,
  AlertTriangle,
  Info,
  ChevronRight
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOperationsStore } from '../store/operationsStore'
import { webSocketService } from '../services/websocket'
import { notificationsApi } from '../services/notifications'
import { useNavigate } from 'react-router-dom'
import type { NotificationResponse } from '../types/notification'

export default function Topbar() {
  const { currentUser, logout, accessToken } = useAuthStore()
  const {
    connectionStatus,
    notifications,
    unreadCount,
    setNotifications,
    markNotificationReadLocally,
    markAllNotificationsReadLocally
  } = useOperationsStore()

  const navigate = useNavigate()
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [activeNotifTab, setActiveNotifTab] = useState<'all' | 'unread' | 'critical'>('all')
  const notifRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (accessToken) {
      webSocketService.connect()
    }
    return () => {
      // Don't disconnect on component re-render, only on logout
    }
  }, [accessToken])

  // Load initial notifications from API
  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationsApi.getAll({ page: 1, page_size: 30 })
        if (res.data?.items) {
          setNotifications(res.data.items)
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }
    if (accessToken) {
      fetchNotifs()
    }
  }, [accessToken, setNotifications])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    webSocketService.disconnect()
    await logout()
    navigate('/login')
  }

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      markNotificationReadLocally(id)
      await notificationsApi.markAsRead(id)
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      markAllNotificationsReadLocally()
      await notificationsApi.markAllAsRead()
    } catch (err) {
      console.error('Failed to mark all as read', err)
    }
  }

  const handleNavigateEntity = (notif: NotificationResponse) => {
    handleMarkAsRead(notif.id)
    setIsNotifOpen(false)

    if (notif.entity_type === 'Defect' || notif.title.toLowerCase().includes('defect')) {
      navigate('/defects')
    } else if (notif.entity_type === 'MaintenanceTask' || notif.title.toLowerCase().includes('maintenance')) {
      navigate('/maintenance')
    } else if (notif.entity_type === 'BlockPlan' || notif.title.toLowerCase().includes('block')) {
      navigate('/blocks')
    } else if (notif.entity_type === 'BlockConflict' || notif.title.toLowerCase().includes('conflict')) {
      navigate('/conflicts')
    } else if (notif.entity_type === 'AIRecommendation' || notif.title.toLowerCase().includes('ai')) {
      navigate('/ai/planner')
    } else {
      navigate('/operations/live')
    }
  }

  const filteredNotifs = notifications.filter((n) => {
    if (activeNotifTab === 'unread') return !n.is_read
    if (activeNotifTab === 'critical') return n.severity === 'CRITICAL'
    return true
  })

  const primaryRole = currentUser?.roles?.[0]?.replace(/_/g, ' ') || 'VIEWER'
  const departmentName = currentUser?.department?.code || ''

  return (
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
      {/* Search */}
      <div className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search assets, tasks, corridors, train operations…"
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
        />
      </div>

      {/* Middle Banner: Live Operations Status Pill */}
      <div className="flex-1 flex justify-center items-center gap-3">
        {/* Synthetic Data Label */}
        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500/90 text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 shadow-sm shadow-amber-500/5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Demonstration Environment • Synthetic Data
        </div>

        {/* Live WebSocket Status Indicator */}
        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase flex items-center gap-1.5 border transition-all ${
            connectionStatus === 'CONNECTED'
              ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
              : connectionStatus === 'RECONNECTING'
              ? 'bg-amber-950/60 border-amber-500/30 text-amber-400'
              : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-400 animate-ping'
                : connectionStatus === 'RECONNECTING'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span>
            {connectionStatus === 'CONNECTED'
              ? '● LIVE'
              : connectionStatus === 'RECONNECTING'
              ? '● RECONNECTING'
              : '● OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 ml-4">
        {/* Notifications Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-mono text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Popover Drawer */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-96 max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider">
                    Operational Alerts
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 font-mono text-[10px] rounded">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Tabs */}
              <div className="flex bg-slate-950/60 border-b border-slate-800 text-xs p-1 gap-1">
                {(['all', 'unread', 'critical'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveNotifTab(tab)}
                    className={`flex-1 py-1.5 px-2 rounded-lg font-semibold uppercase text-[10px] transition-all ${
                      activeNotifTab === tab
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-96 divide-y divide-slate-800/60 text-xs">
                {filteredNotifs.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 font-mono text-xs">
                    No {activeNotifTab} notifications
                  </div>
                ) : (
                  filteredNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNavigateEntity(notif)}
                      className={`p-3.5 hover:bg-slate-800/60 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.is_read ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {notif.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                        ) : notif.severity === 'WARNING' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-bold text-slate-200 text-xs truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span
                            className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border ${
                              notif.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                                : notif.severity === 'WARNING'
                                ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                                : 'bg-blue-950 text-blue-300 border-blue-800/60'
                            }`}
                          >
                            {notif.severity}
                          </span>
                          {notif.entity_type && (
                            <span className="text-[9px] font-mono text-slate-500">
                              {notif.entity_type}: {notif.entity_id || ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {!notif.is_read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          title="Mark read"
                          className="w-2 h-2 rounded-full bg-blue-500 hover:scale-125 transition-transform flex-shrink-0 mt-1.5"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    setIsNotifOpen(false)
                    navigate('/operations/live')
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <span>Open Live Operations Feed</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Info Capsule */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-left hidden md:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-200 leading-none">
                {currentUser?.full_name || currentUser?.username || 'Operator'}
              </p>
              {departmentName && (
                <span className="text-[9px] font-mono uppercase bg-cyan-950/80 text-cyan-400 px-1 py-0.2 rounded border border-cyan-800/50">
                  {departmentName}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mt-1 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-blue-400" />
              {primaryRole}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
