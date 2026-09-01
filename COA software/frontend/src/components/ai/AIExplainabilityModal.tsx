import React from 'react'
import { X } from 'lucide-react'
import { AIExplainabilityCard } from './AIExplainabilityCard'
import type { AIExplainabilityProps } from './AIExplainabilityCard'
import { Button } from '../ui/Button'

interface AIExplainabilityModalProps extends AIExplainabilityProps {
  isOpen: boolean
  onClose: () => void
}

export const AIExplainabilityModal: React.FC<AIExplainabilityModalProps> = ({
  isOpen,
  onClose,
  ...cardProps
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="absolute top-3 right-3 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0 rounded-full border-slate-300 dark:border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        <AIExplainabilityCard {...cardProps} />
      </div>
    </div>
  )
}

export default AIExplainabilityModal
