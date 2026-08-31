import { create } from 'zustand'
import type { OperationEvent, ConnectionStatus } from '../types/websocket'
import type { NotificationResponse } from '../types/api'

interface OperationsState {
  connectionStatus: ConnectionStatus
  recentEvents: OperationEvent[]
  notifications: NotificationResponse[]
  unreadCount: number
  isFeedPaused: boolean
  isLiveDemoActive: boolean

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void
  addEvent: (event: OperationEvent) => void
  clearEvents: () => void
  setFeedPaused: (paused: boolean) => void
  setLiveDemoActive: (active: boolean) => void
  setNotifications: (notifs: NotificationResponse[]) => void
  addNotification: (notif: NotificationResponse) => void
  markNotificationReadLocally: (id: string) => void
  markAllNotificationsReadLocally: () => void
}

export const useOperationsStore = create<OperationsState>((set) => ({
  connectionStatus: 'DISCONNECTED',
  recentEvents: [],
  notifications: [],
  unreadCount: 0,
  isFeedPaused: false,
  isLiveDemoActive: false,

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  addEvent: (event) =>
    set((state) => {
      if (state.isFeedPaused) return state
      const updated = [event, ...state.recentEvents].slice(0, 100)
      return { recentEvents: updated }
    }),

  clearEvents: () => set({ recentEvents: [] }),

  setFeedPaused: (paused) => set({ isFeedPaused: paused }),

  setLiveDemoActive: (active) => set({ isLiveDemoActive: active }),

  setNotifications: (notifs) =>
    set({
      notifications: notifs,
      unreadCount: notifs.filter((n) => !n.is_read).length
    }),

  addNotification: (notif) =>
    set((state) => {
      const exists = state.notifications.some((n) => n.id === notif.id)
      if (exists) return state
      const updated = [notif, ...state.notifications]
      return {
        notifications: updated,
        unreadCount: state.unreadCount + (notif.is_read ? 0 : 1)
      }
    }),

  markNotificationReadLocally: (id) =>
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
      return {
        notifications: updated,
        unreadCount: Math.max(0, state.unreadCount - 1)
      }
    }),

  markAllNotificationsReadLocally: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
      unreadCount: 0
    }))
}))
