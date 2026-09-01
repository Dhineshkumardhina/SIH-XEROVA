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
    return () => {}
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

    if (notif.entity_type === 'Defect' || (notif.title || '').toLowerCase().includes('defect')) {
      navigate('/defects')
    } else if (notif.entity_type === 'MaintenanceTask' || (notif.title || '').toLowerCase().includes('maintenance')) {
      navigate('/maintenance')
    } else if (notif.entity_type === 'BlockPlan' || (notif.title || '').toLowerCase().includes('block')) {
      navigate('/blocks')
    } else if (notif.entity_type === 'BlockConflict' || (notif.title || '').toLowerCase().includes('conflict')) {
      navigate('/conflicts')
    } else if (notif.entity_type === 'AIRecommendation' || (notif.title || '').toLowerCase().includes('ai')) {
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
    <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200">
      {/* Search */}
      <div className="relative w-full max-w-md hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search assets, tasks, corridors, train operations…"
          className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        />
      </div>

      {/* Middle Section: Demo Mode & Synthetic Banner */}
      <div className="flex-1 flex justify-center items-center gap-2.5">
        <div className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-semibold uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
          DEMO MODE
        </div>

        <div className="hidden lg:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
          <button
            onClick={() => navigate('/ai/planner')}
            className="px-2.5 py-1 rounded text-[10px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            title="Load SIH 'Shared Block Optimization' Scenario"
          >
            LOAD SIH DEMO
          </button>
          <button
            onClick={() => navigate('/ai/planner')}
            className="px-2.5 py-1 rounded text-[10px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
            title="Reset Scenario to Deterministic Baseline"
          >
            RESET SIH DEMO
          </button>
        </div>

        <div className="hidden md:flex px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold tracking-wide uppercase items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Demonstration Environment • Synthetic Data
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase flex items-center gap-1.5 border transition-all ${
            connectionStatus === 'CONNECTED'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : connectionStatus === 'RECONNECTING'
              ? 'bg-amber-50 border-amber-200 text-amber-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-600 animate-ping'
                : connectionStatus === 'RECONNECTING'
                ? 'bg-amber-600 animate-pulse'
                : 'bg-rose-600'
            }`}
          />
          <span>
            {connectionStatus === 'CONNECTED'
              ? 'NORMAL'
              : connectionStatus === 'RECONNECTING'
              ? 'RECONNECTING'
              : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 ml-4">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white font-mono text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-96 max-h-[85vh] bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="font-semibold text-xs text-slate-900 uppercase tracking-wider">
                    Operational Alerts
                  </h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 font-mono text-[10px] rounded border border-blue-200">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="flex bg-slate-50 border-b border-slate-200 text-xs p-1 gap-1">
                {(['all', 'unread', 'critical'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveNotifTab(tab)}
                    className={`flex-1 py-1 px-2 rounded font-semibold uppercase text-[10px] transition-all ${
                      activeNotifTab === tab
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="overflow-y-auto max-h-96 divide-y divide-slate-100 text-xs">
                {filteredNotifs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 font-mono text-xs">
                    No {activeNotifTab} notifications
                  </div>
                ) : (
                  filteredNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNavigateEntity(notif)}
                      className={`p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notif.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {notif.severity === 'CRITICAL' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : notif.severity === 'WARNING' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {notif.title}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    setIsNotifOpen(false)
                    navigate('/operations/live')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                >
                  <span>Open Live Operations Feed</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
            <UserIcon className="w-3.5 h-3.5" />
          </div>
          <div className="text-left hidden md:block">
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-semibold text-slate-900 leading-none">
                {currentUser?.full_name || currentUser?.username || 'Operator'}
              </p>
              {departmentName && (
                <span className="text-[9px] font-mono uppercase bg-slate-200 text-slate-700 px-1 py-0.2 rounded">
                  {departmentName}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium uppercase mt-0.5 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-blue-600" />
              {primaryRole}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          title="Sign Out"
          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
