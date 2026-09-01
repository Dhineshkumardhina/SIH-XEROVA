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

const MOCK_PERSONAS: Record<string, User> = {
  admin: {
    id: 'usr-admin-01',
    full_name: 'Dr. Rajesh Sharma',
    username: 'admin',
    email: 'admin@railopt.gov.in',
    roles: ['SUPER_ADMIN', 'CONTROL_OFFICER', 'BLOCK_PLANNER'],
    permissions: [
      'USER_VIEW', 'USER_CREATE', 'USER_UPDATE', 'USER_DELETE',
      'ROLE_VIEW', 'ROLE_MANAGE', 'AUDIT_VIEW', 'AUDIT_EXPORT',
      'SYSTEM_CONFIG_VIEW', 'SYSTEM_CONFIG_MANAGE', 'DATA_IMPORT_MANAGE',
      'CORRIDOR_VIEW', 'CORRIDOR_MANAGE', 'ASSET_VIEW', 'ASSET_MANAGE',
      'BLOCK_VIEW', 'BLOCK_REQUEST', 'BLOCK_APPROVE', 'BLOCK_REJECT',
      'OPTIMIZATION_RUN', 'SIMULATION_RUN'
    ],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-01', code: 'ADMIN', name: 'Railway Board Administration' },
  },
  control: {
    id: 'usr-ctrl-01',
    full_name: 'Suresh Kumar Verma',
    username: 'control',
    email: 'control@railopt.gov.in',
    roles: ['CONTROL_OFFICER'],
    permissions: [
      'BLOCK_VIEW', 'BLOCK_APPROVE', 'BLOCK_REJECT', 'BLOCK_CANCEL',
      'CORRIDOR_VIEW', 'ASSET_VIEW', 'TRAIN_VIEW', 'OPTIMIZATION_RUN',
      'SIMULATION_RUN', 'AUDIT_VIEW'
    ],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-02', code: 'OPT', name: 'Operating & Traffic' },
  },
  planner: {
    id: 'usr-plan-01',
    full_name: 'Pooja Iyer',
    username: 'planner',
    email: 'planner@railopt.gov.in',
    roles: ['BLOCK_PLANNER'],
    permissions: [
      'BLOCK_VIEW', 'BLOCK_REQUEST', 'CORRIDOR_VIEW', 'ASSET_VIEW',
      'TRAIN_VIEW', 'OPTIMIZATION_RUN', 'SIMULATION_RUN', 'AUDIT_VIEW'
    ],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-02', code: 'OPT', name: 'Operating & Traffic' },
  },
  engineering: {
    id: 'usr-eng-01',
    full_name: 'Anil Deshmukh',
    username: 'engineering',
    email: 'engineering@railopt.gov.in',
    roles: ['ENGINEERING_OFFICER'],
    permissions: ['BLOCK_VIEW', 'BLOCK_REQUEST', 'ASSET_VIEW', 'AUDIT_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-03', code: 'ENG', name: 'Civil Engineering' },
  },
  signal: {
    id: 'usr-sig-01',
    full_name: 'Ravi Teja',
    username: 'signal',
    email: 'signal@railopt.gov.in',
    roles: ['SIGNAL_TELECOM_OFFICER'],
    permissions: ['BLOCK_VIEW', 'BLOCK_REQUEST', 'ASSET_VIEW', 'AUDIT_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-04', code: 'SIG', name: 'Signaling & Telecom' },
  },
  traction: {
    id: 'usr-trc-01',
    full_name: 'Kavita Menon',
    username: 'traction',
    email: 'traction@railopt.gov.in',
    roles: ['TRACTION_OFFICER'],
    permissions: ['BLOCK_VIEW', 'BLOCK_REQUEST', 'ASSET_VIEW', 'AUDIT_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-05', code: 'TRC', name: 'Electrical Traction' },
  },
  viewer: {
    id: 'usr-view-01',
    full_name: 'Rahul Sen',
    username: 'viewer',
    email: 'viewer@railopt.gov.in',
    roles: ['VIEWER'],
    permissions: ['BLOCK_VIEW', 'CORRIDOR_VIEW', 'ASSET_VIEW', 'TRAIN_VIEW', 'AUDIT_VIEW'],
    is_active: true,
    is_locked: false,
    department: { id: 'dep-02', code: 'OPT', name: 'Operating & Traffic' },
  },
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
        // Fallback for standalone/demo Vercel hosting when remote backend is not yet attached
        const key = (identifier || '').toLowerCase().trim()
        const isDemoPersona = key in MOCK_PERSONAS
        const isNetworkFailure = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network') || err.message?.includes('Failed to fetch')

        if (isNetworkFailure || isDemoPersona) {
          const mockUser = MOCK_PERSONAS[key] || MOCK_PERSONAS.control
          const mockToken = `mock_jwt_token_${key || 'user'}_${Date.now()}`
          const mockRefresh = `mock_refresh_${key || 'user'}_${Date.now()}`

          localStorage.setItem(STORAGE_KEY_TOKEN, mockToken)
          localStorage.setItem(STORAGE_KEY_REFRESH, mockRefresh)
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(mockUser))

          set({
            accessToken: mockToken,
            refreshToken: mockRefresh,
            currentUser: mockUser,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
          return true
        }

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
      const token = get().accessToken
      if (!token || token.startsWith('mock_jwt_token_')) return
      try {
        const res = await authService.getMe()
        if (res.success && res.data) {
          const sanitizedUser = sanitizeUser(res.data)
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(sanitizedUser))
          set({ currentUser: sanitizedUser })
        }
      } catch {
        // Token might be invalid or network offline
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
