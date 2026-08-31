import api from './api'
import type { User, LoginResponseData, DepartmentSummary } from '../types/user'
import type { ApiResponse } from '../types/common'

export type { User, LoginResponseData, DepartmentSummary }

export const authService = {
  async login(usernameOrEmail: string, password: string): Promise<ApiResponse<LoginResponseData>> {
    const res = await api.post<ApiResponse<LoginResponseData>>('/auth/login', {
      username_or_email: usernameOrEmail,
      password,
    })
    return res.data
  },

  async refresh(refreshToken: string): Promise<ApiResponse<LoginResponseData>> {
    const res = await api.post<ApiResponse<LoginResponseData>>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return res.data
  },

  async logout(refreshToken?: string): Promise<ApiResponse<Record<string, unknown>>> {
    const res = await api.post<ApiResponse<Record<string, unknown>>>('/auth/logout', {
      refresh_token: refreshToken,
    })
    return res.data
  },

  async getMe(): Promise<ApiResponse<User>> {
    const res = await api.get<ApiResponse<User>>('/auth/me')
    return res.data
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<Record<string, unknown>>> {
    const res = await api.post<ApiResponse<Record<string, unknown>>>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return res.data
  },
}

export default authService
