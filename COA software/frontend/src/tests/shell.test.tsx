import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../services/queryClient'
import { LoginPage } from '../pages/Login'
import { NotFoundPage } from '../pages/NotFound'
import { Sidebar } from '../components/layout/Sidebar'
import { ProtectedRoute } from '../auth/ProtectedRoute'
import { LoadingState } from '../components/ui/LoadingState'
import { ErrorState } from '../components/ui/ErrorState'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

// Helper wrapper for router and query provider
const renderWithProviders = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RAILOPT AI Phase 6 Frontend Shell Test Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      currentUser: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    })
    useUIStore.setState({
      theme: 'dark',
      sidebarCollapsed: false,
      mobileOpen: false,
      searchOpen: false,
      notificationsOpen: false,
    })
  })

  // Test 1: Login rendering
  it('1. renders login page with branding and input fields', () => {
    renderWithProviders(<LoginPage />)
    expect(screen.getByText(/RAILOPT AI/i)).toBeInTheDocument()
    expect(screen.getByText(/AI-Powered Railway Block Planning/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Username or Official Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SIGN IN/i })).toBeInTheDocument()
  })

  // Test 2: Login validation
  it('2. displays validation error on failed authentication attempt', async () => {
    // Mock failure in authStore
    useAuthStore.setState({
      login: vi.fn().mockImplementation(async () => {
        useAuthStore.setState({ error: 'Invalid railway credentials' })
        return false
      }),
    })

    renderWithProviders(<LoginPage />)
    const submitBtn = screen.getByRole('button', { name: /SIGN IN/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText(/Invalid railway credentials/i)).toBeInTheDocument()
    })
  })

  // Test 3: Protected route redirection
  it('3. redirects unauthenticated users to /login', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>LOGIN_PAGE_MOCK</div>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>PROTECTED_DASHBOARD</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: '/dashboard' }
    )

    expect(screen.getByText('LOGIN_PAGE_MOCK')).toBeInTheDocument()
    expect(screen.queryByText('PROTECTED_DASHBOARD')).not.toBeInTheDocument()
  })

  // Test 4: Sidebar navigation rendering
  it('4. renders sidebar navigation items correctly for authenticated user', () => {
    useAuthStore.setState({
      currentUser: {
        id: 'u-1',
        username: 'control',
        email: 'control@railopt.gov.in',
        full_name: 'Chief Controller',
        roles: ['CONTROL_OFFICER'],
        permissions: ['DASHBOARD_VIEW', 'TRAIN_VIEW', 'CORRIDOR_VIEW', 'BLOCK_VIEW'],
        is_active: true,
        is_locked: false,
      },
      isAuthenticated: true,
    })

    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Train Operations')).toBeInTheDocument()
    expect(screen.getByText('Corridors')).toBeInTheDocument()
    expect(screen.getByText('Block Requests')).toBeInTheDocument()
  })

  // Test 5: RBAC navigation filtering
  it('5. filters sidebar navigation based on role privileges', () => {
    // Viewer lacks admin and editing permissions
    useAuthStore.setState({
      currentUser: {
        id: 'u-2',
        username: 'viewer',
        email: 'viewer@railopt.gov.in',
        full_name: 'Readonly Viewer',
        roles: ['VIEWER'],
        permissions: ['DASHBOARD_VIEW'],
        is_active: true,
        is_locked: false,
      },
      isAuthenticated: true,
    })

    renderWithProviders(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    // Admin should NOT be visible to VIEWER
    expect(screen.queryByText('Administration')).not.toBeInTheDocument()
  })

  // Test 6: Logout action
  it('6. clears authentication tokens and session on logout', async () => {
    const logoutMock = vi.fn().mockImplementation(async () => {
      useAuthStore.setState({
        currentUser: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      })
    })
    useAuthStore.setState({
      currentUser: {
        id: 'u-1',
        username: 'control',
        email: 'control@railopt.gov.in',
        full_name: 'Chief Controller',
        roles: ['CONTROL_OFFICER'],
        permissions: [],
        is_active: true,
        is_locked: false,
      },
      isAuthenticated: true,
      logout: logoutMock,
    })

    renderWithProviders(<Sidebar />)
    const signOutBtn = screen.getByText('Sign Out')
    await waitFor(async () => {
      fireEvent.click(signOutBtn)
    })

    expect(logoutMock).toHaveBeenCalled()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  // Test 7: Theme switching
  it('7. toggles theme between light and dark mode in uiStore', () => {
    const ui = useUIStore.getState()
    expect(ui.theme).toBe('dark')

    ui.toggleTheme()
    expect(useUIStore.getState().theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    ui.toggleTheme()
    expect(useUIStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  // Test 8: Loading state rendering
  it('8. renders loading state spinner and message', () => {
    renderWithProviders(<LoadingState message="Fetching live block plans..." />)
    expect(screen.getByText('Fetching live block plans...')).toBeInTheDocument()
  })

  // Test 9: Error state rendering with retry callback
  it('9. renders error state with message and triggers retry on button click', () => {
    const onRetry = vi.fn()
    renderWithProviders(<ErrorState message="Corridor service unavailable" onRetry={onRetry} />)
    expect(screen.getByText('Corridor service unavailable')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Retry/i })
    fireEvent.click(retryBtn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  // Test 10: 404 page rendering
  it('10. renders 404 page with return to dashboard action', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Page not found')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Back to Dashboard/i })).toBeInTheDocument()
  })
})
