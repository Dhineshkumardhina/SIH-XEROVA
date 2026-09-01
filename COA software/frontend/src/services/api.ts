import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiErrorResponse } from '../types/common'
import { getMockApiResponse } from './mockApiHandler'

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

// Response Interceptor: token refresh queue & synthetic mock fallback
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

    // Gracefully handle offline / standalone demo / Vercel cloud environment when remote backend is not yet attached
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('timeout') ||
      error.response?.status === 404 ||
      error.response?.status === 500 ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504

    if (isNetworkError && originalRequest?.url && !originalRequest.url.includes('/auth/login')) {
      const mockData = getMockApiResponse(
        originalRequest.url,
        originalRequest.method,
        originalRequest.data
      )
      return {
        data: mockData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: originalRequest,
      }
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      const refreshToken = localStorage.getItem('railopt_refresh_token')
      const isMockToken =
        localStorage.getItem('railopt_access_token')?.startsWith('mock_') ||
        refreshToken?.startsWith('mock_')

      // In demo / standalone mode or expired session without real backend refresh, fallback to mock API gracefully
      if (!refreshToken || isMockToken) {
        if (originalRequest?.url) {
          const mockData = getMockApiResponse(
            originalRequest.url,
            originalRequest.method,
            originalRequest.data
          )
          return {
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: originalRequest,
          }
        }
      }

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
        // If refresh fails, fall back to mock data instead of breaking UI
        if (originalRequest?.url) {
          const mockData = getMockApiResponse(
            originalRequest.url,
            originalRequest.method,
            originalRequest.data
          )
          return {
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: originalRequest,
          }
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
