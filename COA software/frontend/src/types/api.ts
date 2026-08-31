export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export type Department = 'TMS' | 'SMMS' | 'TDMS' | 'COA'
export * from './notification'

