import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '../types/common'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request Interceptor: inject Bearer token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('railopt_access_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response Interceptor: token refresh queue
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
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('railopt_refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('railopt_access_token')
        localStorage.removeItem('railopt_refresh_token')
        localStorage.removeItem('railopt_user')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }

      try {
        const refreshResponse = await axios.post(`${baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const newAccessToken = refreshResponse.data?.data?.access_token
        const newRefreshToken = refreshResponse.data?.data?.refresh_token

        if (newAccessToken) {
          localStorage.setItem('railopt_access_token', newAccessToken)
          if (newRefreshToken) {
            localStorage.setItem('railopt_refresh_token', newRefreshToken)
          }

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
          }

          processQueue(null, newAccessToken)
          return api(originalRequest)
        } else {
          throw new Error('Refresh failed: invalid response')
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.removeItem('railopt_access_token')
        localStorage.removeItem('railopt_refresh_token')
        localStorage.removeItem('railopt_user')
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login'
        }
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export { api as apiClient }
export default api

