import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
import { Button } from '../components/ui/Button'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center mx-auto mb-2">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 font-mono">404</h1>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Page not found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
          The requested railway management route or operational resource does not exist.
        </p>
        <div className="pt-4">
          <Link to="/dashboard">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
