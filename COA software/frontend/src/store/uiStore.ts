import { create } from 'zustand'
import type { ThemeMode } from '../types/common'

interface UIState {
  theme: ThemeMode
  sidebarCollapsed: boolean
  mobileOpen: boolean
  searchOpen: boolean
  notificationsOpen: boolean

  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobile: () => void
  setMobileOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
  toggleNotifications: () => void
  setNotificationsOpen: (open: boolean) => void
}

const THEME_STORAGE_KEY = 'railopt_theme'

const getInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
  if (saved === 'dark') return 'dark'
  return 'light'
}

export const useUIStore = create<UIState>((set) => {
  const initialTheme = getInitialTheme()

  // Apply initial theme class to HTML root
  if (typeof document !== 'undefined') {
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return {
    theme: initialTheme,
    sidebarCollapsed: false,
    mobileOpen: false,
    searchOpen: false,
    notificationsOpen: false,

    setTheme: (theme: ThemeMode) => {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      if (typeof document !== 'undefined') {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
      set({ theme })
    },

    toggleTheme: () => {
      set((state) => {
        const next = state.theme === 'dark' ? 'light' : 'dark'
        localStorage.setItem(THEME_STORAGE_KEY, next)
        if (typeof document !== 'undefined') {
          if (next === 'dark') {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
        return { theme: next }
      })
    },

    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
    setMobileOpen: (mobileOpen) => set({ mobileOpen }),
    setSearchOpen: (searchOpen) => set({ searchOpen }),
    toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen })),
    setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  }
})
