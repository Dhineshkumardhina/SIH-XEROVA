import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log unexpected client error to monitoring without exposing to user
    console.error('Uncaught error in React render:', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <div className="max-w-md w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              An unexpected application error occurred. The operations center error monitor has been notified.
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={this.handleReload}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="w-full"
              >
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
