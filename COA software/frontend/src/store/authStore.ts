import { create } from 'zustand'
import { authService, type User } from '../services/auth'

interface AuthState {
  currentUser: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (identifier: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
  fetchCurrentUser: () => Promise<void>
  hasRole: (roleCode: string) => boolean
  hasAnyRole: (roleCodes: string[]) => boolean
  hasPermission: (permCode: string) => boolean
  clearError: () => void
}

const STORAGE_KEY_TOKEN = 'railopt_access_token'
const STORAGE_KEY_REFRESH = 'railopt_refresh_token'
const STORAGE_KEY_USER = 'railopt_user'

const sanitizeUser = (user: any): User | null => {
  if (!user || typeof user !== 'object') return null
  return {
    ...user,
    roles: Array.isArray(user.roles) ? user.roles : [],
    permissions: Array.isArray(user.permissions) ? user.permissions : [],
  }
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize from storage if available
  const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN)
  const savedRefresh = localStorage.getItem(STORAGE_KEY_REFRESH)
  let savedUser: User | null = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER)
    if (raw) savedUser = sanitizeUser(JSON.parse(raw))
  } catch {
    savedUser = null
  }

  return {
    currentUser: savedUser,
    accessToken: savedToken,
    refreshToken: savedRefresh,
    isAuthenticated: Boolean(savedToken && savedUser),
    isLoading: false,
    error: null,

    login: async (identifier: string, password: string) => {
      set({ isLoading: true, error: null })
      try {
        const response = await authService.login(identifier, password)
        if (response.success && response.data) {
          const { access_token, refresh_token, user } = response.data
          const sanitizedUser = sanitizeUser(user)
          localStorage.setItem(STORAGE_KEY_TOKEN, access_token)
          localStorage.setItem(STORAGE_KEY_REFRESH, refresh_token)
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sanitizedUser))

          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            currentUser: sanitizedUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          return true
        }
        set({ isLoading: false, error: response.message || 'Login failed' })
        return false
      } catch (err: any) {
        const errorObj = err.response?.data?.error
        const detail = err.response?.data?.detail
        const message =
          errorObj?.message ||
          (typeof detail === 'object' ? detail.message : detail) ||
          err.message ||
          'Authentication failed'
        set({ isLoading: false, error: message, isAuthenticated: false })
        return false
      }
    },

    logout: async () => {
      const refresh = get().refreshToken
      try {
        if (refresh) {
          await authService.logout(refresh)
        }
      } catch {
        // Continue clearing local state even if server logout fails
      } finally {
        localStorage.removeItem(STORAGE_KEY_TOKEN)
        localStorage.removeItem(STORAGE_KEY_REFRESH)
        localStorage.removeItem(STORAGE_KEY_USER)

        set({
          currentUser: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      }
    },

    refreshSession: async () => {
      const currentRefresh = get().refreshToken || localStorage.getItem(STORAGE_KEY_REFRESH)
      if (!currentRefresh) {
        get().logout()
        return false
      }

      try {
        const response = await authService.refresh(currentRefresh)
        if (response.success && response.data) {
          const { access_token, refresh_token, user } = response.data
          const sanitizedUser = sanitizeUser(user)
          localStorage.setItem(STORAGE_KEY_TOKEN, access_token)
          localStorage.setItem(STORAGE_KEY_REFRESH, refresh_token)
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sanitizedUser))

          set({
            accessToken: access_token,
            refreshToken: refresh_token,
            currentUser: sanitizedUser,
            isAuthenticated: true,
          })
          return true
        }
        get().logout()
        return false
      } catch {
        get().logout()
        return false
      }
    },

    fetchCurrentUser: async () => {
      try {
        const res = await authService.getMe()
        if (res.success && res.data) {
          const sanitizedUser = sanitizeUser(res.data)
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sanitizedUser))
          set({ currentUser: sanitizedUser })
        }
      } catch {
        // Token might be invalid
      }
    },

    hasRole: (roleCode: string) => {
      const user = get().currentUser
      if (!user) return false
      const roles = Array.isArray(user.roles) ? user.roles : []
      if (roles.includes('SUPER_ADMIN')) return true
      return roles.includes(roleCode)
    },

    hasAnyRole: (roleCodes: string[]) => {
      const user = get().currentUser
      if (!user) return false
      const roles = Array.isArray(user.roles) ? user.roles : []
      if (roles.includes('SUPER_ADMIN')) return true
      return roles.some((r) => Array.isArray(roleCodes) && roleCodes.includes(r))
    },

    hasPermission: (permCode: string) => {
      const user = get().currentUser
      if (!user) return false
      const roles = Array.isArray(user.roles) ? user.roles : []
      if (roles.includes('SUPER_ADMIN')) return true
      const permissions = Array.isArray(user.permissions) ? user.permissions : []
      return permissions.includes(permCode)
    },

    clearError: () => set({ error: null }),
  }
})
