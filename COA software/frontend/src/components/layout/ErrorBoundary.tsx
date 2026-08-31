import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertOctagon, RotateCcw, Home, RefreshCw, ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  isPageLevel?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  showDetails: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React render:', error, errorInfo)
    this.setState({ errorInfo })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/dashboard'
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  public render() {
    if (this.state.hasError) {
      const isPageLevel = this.props.isPageLevel
      const errorMsg = this.state.error?.message || 'An unexpected application error occurred.'

      return (
        <div
          className={
            isPageLevel
              ? 'p-8 flex items-center justify-center min-h-[400px]'
              : 'min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100'
          }
        >
          <div className="max-w-lg w-full p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {errorMsg}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Try Again
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={this.handleGoHome}
                leftIcon={<Home className="w-3.5 h-3.5" />}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={this.handleReload}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reload
              </Button>
            </div>

            {/* Error Diagnostics Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-left">
              <button
                type="button"
                onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                className="text-[11px] text-slate-400 hover:text-slate-300 flex items-center gap-1 font-mono mx-auto cursor-pointer"
              >
                <span>Diagnostics & Stack</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${this.state.showDetails ? 'rotate-180' : ''}`} />
              </button>

              {this.state.showDetails && (
                <pre className="mt-2 p-3 bg-slate-950 text-red-400 rounded-lg text-[10px] font-mono overflow-x-auto max-h-40 border border-slate-800 whitespace-pre-wrap">
                  {this.state.error?.stack || String(this.state.error)}
                </pre>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

