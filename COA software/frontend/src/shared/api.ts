import axios from 'axios'
import type { DashboardStats } from '../types/dashboard'
import type { BlockPlan } from '../types/block'
import type { MaintenanceTask } from '../types/maintenance'
import type { Asset } from '../types/asset'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// Request Interceptor: inject Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('railopt_access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: handle 401 with token refresh queue
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const currentRefreshToken = localStorage.getItem('railopt_refresh_token')
      if (!currentRefreshToken) {
        isRefreshing = false
        localStorage.removeItem('railopt_access_token')
        localStorage.removeItem('railopt_refresh_token')
        localStorage.removeItem('railopt_user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/api/v1/auth/refresh`,
          { refresh_token: currentRefreshToken }
        )

        if (refreshResponse.data?.success && refreshResponse.data?.data) {
          const { access_token, refresh_token, user } = refreshResponse.data.data
          localStorage.setItem('railopt_access_token', access_token)
          localStorage.setItem('railopt_refresh_token', refresh_token)
          localStorage.setItem('railopt_user', JSON.stringify(user))

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          processQueue(null, access_token)
          return api(originalRequest)
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('railopt_access_token')
        localStorage.removeItem('railopt_refresh_token')
        localStorage.removeItem('railopt_user')
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ── Dashboard ───────────────────────────────────────────────────────

export const fetchDashboardStats = () =>
  api.get<DashboardStats>('/api/v1/dashboard/stats').then((r) => r.data)

export const fetchRecommendations = () =>
  api.get<BlockPlan[]>('/api/v1/dashboard/recommendations').then((r) => r.data)

export const fetchPriorityTasks = () =>
  api.get<MaintenanceTask[]>('/api/v1/dashboard/priority-tasks').then((r) => r.data)

// ── Assets ──────────────────────────────────────────────────────────

export const fetchAssets = () =>
  api.get<Asset[]>('/api/v1/assets').then((r) => r.data)

// ── Blocks ──────────────────────────────────────────────────────────

export const fetchBlockPlans = () =>
  api.get<BlockPlan[]>('/api/v1/blocks').then((r) => r.data)

export const createBlockPlan = (data: Partial<BlockPlan>) =>
  api.post<BlockPlan>('/api/v1/blocks', data).then((r) => r.data)

export const approveBlockPlan = (id: string) =>
  api.patch<BlockPlan>(`/api/v1/blocks/${id}/approve`).then((r) => r.data)

// ── Tasks ───────────────────────────────────────────────────────────

export const fetchTasks = () =>
  api.get<MaintenanceTask[]>('/api/v1/tasks').then((r) => r.data)

// ── Optimization ────────────────────────────────────────────────────

export interface OptimizeRequest {
  corridor: string
  date: string
  max_train_impact: number
}

export interface OptimizeResponse {
  plan: BlockPlan
  conflicts_resolved: number
  efficiency_score: number
}

export const runOptimization = (data: OptimizeRequest) =>
  api.post<OptimizeResponse>('/api/v1/optimize', data).then((r) => r.data)

export default api
