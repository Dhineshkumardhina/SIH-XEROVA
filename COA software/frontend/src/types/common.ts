export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface PaginationMeta {
  page: number
  page_size: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface PaginatedResponse<T> {
  success: boolean
  data: PaginatedData<T>
  message?: string
}

export interface ApiErrorDetail {
  code: string
  message: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiErrorDetail
  detail?: ApiErrorDetail
}

export type ThemeMode = 'light' | 'dark'

export type OperationalStatus = 'NORMAL' | 'CAUTION' | 'CRITICAL'
