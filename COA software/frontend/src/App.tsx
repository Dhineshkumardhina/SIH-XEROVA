import React, { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './services/queryClient'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { AppRoutes } from './routes/AppRoutes'
import { useAuthStore } from './store/authStore'

export const App: React.FC = () => {
  const { fetchCurrentUser } = useAuthStore()

  useEffect(() => {
    // Validate or restore user profile on initial load
    fetchCurrentUser().catch(() => {})
  }, [fetchCurrentUser])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
