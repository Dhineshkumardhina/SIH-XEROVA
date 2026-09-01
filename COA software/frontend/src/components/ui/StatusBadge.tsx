import React from 'react'
import { Badge } from './Badge'

export interface StatusBadgeProps {
  status?: string | null
  size?: 'sm' | 'md'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className }) => {
  const normalized = (status || '').toUpperCase()

  let variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'purple' = 'neutral'

  switch (normalized) {
    case 'HEALTHY':
    case 'COMPLETED':
    case 'APPROVED':
    case 'ACTIVE':
    case 'RESOLVED':
    case 'NORMAL':
    case 'AVAILABLE':
      variant = 'success'
      break

    case 'HIGH':
    case 'DEGRADED':
    case 'UNDER_REVIEW':
    case 'SCHEDULED':
    case 'PENDING_APPROVAL':
    case 'WARNING':
    case 'CAUTION':
    case 'PENDING':
      variant = 'warning'
      break

    case 'CRITICAL':
    case 'OVERDUE':
    case 'OUT_OF_SERVICE':
    case 'REJECTED':
    case 'FAILED':
    case 'CONFLICT':
      variant = 'danger'
      break

    case 'IN_PROGRESS':
    case 'SUBMITTED':
    case 'PLANNED':
    case 'PASS':
    case 'RUNNING':
      variant = 'info'
      break

    case 'AI_ANALYZED':
    case 'AI_RECOMMENDED':
    case 'OPTIMIZED':
      variant = 'purple'
      break

    case 'LOW':
    case 'MEDIUM':
    case 'DRAFT':
    case 'INACTIVE':
    case 'CANCELLED':
    case 'CLOSED':
    default:
      variant = 'neutral'
      break
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {normalized.replace(/_/g, ' ')}
    </Badge>
  )
}

export default StatusBadge
