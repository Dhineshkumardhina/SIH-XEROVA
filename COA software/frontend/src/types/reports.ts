/**
 * RAILOPT AI — Reports Types
 * TypeScript interfaces for operational reports, configurations, and exports.
 */

export type ReportType =
  | 'DAILY_BLOCK_PLAN'
  | 'WEEKLY_BLOCK_PLAN'
  | 'MONTHLY_BLOCK_PLAN'
  | 'MAINTENANCE_REPORT'
  | 'ASSET_AVAILABILITY'
  | 'TRAIN_IMPACT'
  | 'AI_OPTIMIZATION'
  | 'CONFLICT_REPORT'
  | 'EXECUTIVE_SUMMARY'

export interface ReportItem {
  id: string
  report_code: string
  report_type: ReportType
  title: string
  generated_by: string
  start_date?: string
  end_date?: string
  summary_metrics: Record<string, any>
  status: 'GENERATING' | 'COMPLETED' | 'FAILED'
  created_at: string
  completed_at?: string
}

export interface ReportDetail extends ReportItem {
  parameters: {
    department?: string
    corridor_id?: string
    options?: Record<string, any>
    details?: Record<string, any>
  }
}

export interface ReportGeneratePayload {
  report_type: ReportType
  start_date?: string
  end_date?: string
  department?: string
  corridor_id?: string
  options?: {
    include_charts?: boolean
    include_details?: boolean
    include_train_impact?: boolean
    include_ai_explanation?: boolean
    include_optimization_metrics?: boolean
  }
}

export interface ReportCardMeta {
  type: ReportType
  name: string
  description: string
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND'
  category: 'BLOCKS' | 'MAINTENANCE' | 'ASSETS' | 'OPERATIONS' | 'EXECUTIVE'
  badgeColor: string
}
