import React from 'react'
import { Link } from 'react-router-dom'
import { Layers, ArrowLeft, CheckCircle2, Shield } from 'lucide-react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

export interface ModulePlaceholderProps {
  title: string
  description: string
  phase: string
  phaseNumber: number
  category?: string
  features?: string[]
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  title,
  description,
  phase,
  phaseNumber,
  category = 'Operations Module',
  features = [
    'CRDM database integration mapped',
    'FastAPI REST endpoints active under /api/v1',
    'RBAC permissions established',
    'Synthetic test datasets seeded',
  ],
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={description}
        breadcrumbs={[
          { label: 'RAILOPT AI', href: '/dashboard' },
          { label: category },
          { label: title },
        ]}
        actions={
          <Badge variant="purple" size="md">
            Scheduled for {phase}
          </Badge>
        }
      />

      <Card className="max-w-3xl">
        <CardContent className="p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Phase {phaseNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Module ready for implementation
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              Foundations Ready in Current Shell:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ModulePlaceholder
