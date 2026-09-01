import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../services/queryClient'
import { AppRoutes } from '../routes/AppRoutes'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'

const renderAppRoute = (route: string) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Comprehensive Application Routes & Navigation Test Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      currentUser: {
        id: 'super-admin-1',
        username: 'admin',
        email: 'admin@railopt.gov.in',
        full_name: 'Super Administrator',
        roles: ['SUPER_ADMIN'],
        permissions: [
          'DASHBOARD_VIEW',
          'TRAIN_VIEW',
          'CORRIDOR_VIEW',
          'BLOCK_VIEW',
          'BLOCK_APPROVE',
          'ASSET_VIEW',
          'MAINTENANCE_VIEW',
          'DEFECT_VIEW',
          'AI_VIEW',
          'SIMULATION_VIEW',
          'ANALYTICS_VIEW',
          'REPORT_VIEW',
          'USER_MANAGE',
        ],
        is_active: true,
        is_locked: false,
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    })
    useUIStore.setState({
      theme: 'light',
      sidebarCollapsed: false,
      mobileOpen: false,
      searchOpen: false,
      notificationsOpen: false,
    })
  })

  const testRoutes = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/demo', label: 'Demo Presentation' },
    { path: '/assets', label: 'Assets' },
    { path: '/assets/tracks', label: 'Track Assets' },
    { path: '/assets/signals', label: 'Signal Assets' },
    { path: '/assets/telecom', label: 'Telecom Assets' },
    { path: '/assets/ohe', label: 'OHE Assets' },
    { path: '/maintenance', label: 'Maintenance' },
    { path: '/maintenance/tasks', label: 'Maintenance Tasks' },
    { path: '/maintenance/overdue', label: 'Maintenance Overdue' },
    { path: '/maintenance/critical', label: 'Maintenance Critical' },
    { path: '/maintenance/calendar', label: 'Maintenance Calendar' },
    { path: '/maintenance/list', label: 'Maintenance List Alias' },
    { path: '/defects', label: 'Defects' },
    { path: '/defects/list', label: 'Defects List' },
    { path: '/defects/critical', label: 'Defects Critical' },
    { path: '/defects/overdue', label: 'Defects Overdue' },
    { path: '/trains', label: 'Trains Operations' },
    { path: '/trains/list', label: 'Trains List' },
    { path: '/corridors', label: 'Corridors' },
    { path: '/corridors/map', label: 'Corridors Map' },
    { path: '/operations', label: 'Live Operations' },
    { path: '/operations/live', label: 'Live Operations Feed' },
    { path: '/conflicts', label: 'Conflicts' },
    { path: '/blocks', label: 'Blocks Overview' },
    { path: '/blocks/requests', label: 'Block Requests' },
    { path: '/blocks/pending', label: 'Pending Blocks' },
    { path: '/blocks/approved', label: 'Approved Blocks' },
    { path: '/blocks/conflicts', label: 'Block Conflicts' },
    { path: '/blocks/list', label: 'Blocks List Alias' },
    { path: '/ai', label: 'AI Intelligence' },
    { path: '/ai/planner', label: 'AI Planner Route' },
    { path: '/ai/priority', label: 'AI Priority' },
    { path: '/ai/risk', label: 'AI Risk' },
    { path: '/ai/recommendations', label: 'AI Recommendations' },
    { path: '/planner', label: 'Planner' },
    { path: '/planner/ai', label: 'Planner AI' },
    { path: '/planner/optimization-result', label: 'Optimization Result' },
    { path: '/planner/daily', label: 'Daily Planner' },
    { path: '/planner/weekly', label: 'Weekly Planner' },
    { path: '/planner/monthly', label: 'Monthly Planner' },
    { path: '/simulation', label: 'Simulation' },
    { path: '/simulation/digital-twin', label: 'Digital Twin' },
    { path: '/simulation/scenarios', label: 'Simulation Scenarios' },
    { path: '/simulation/results', label: 'Simulation Results' },
    { path: '/analytics', label: 'Analytics' },
    { path: '/analytics/assets', label: 'Asset Analytics' },
    { path: '/analytics/blocks', label: 'Block Analytics' },
    { path: '/analytics/maintenance', label: 'Maintenance Analytics' },
    { path: '/analytics/train-impact', label: 'Train Impact Analytics' },
    { path: '/reports', label: 'Reports' },
    { path: '/reports/daily', label: 'Daily Reports' },
    { path: '/reports/weekly', label: 'Weekly Reports' },
    { path: '/reports/monthly', label: 'Monthly Reports' },
    { path: '/notifications', label: 'Notifications' },
    { path: '/audit', label: 'Audit Trail' },
    { path: '/architecture', label: 'System Architecture' },
    { path: '/admin', label: 'Admin Users' },
    { path: '/admin/users', label: 'Admin Users Tab' },
    { path: '/admin/roles', label: 'Admin Roles Tab' },
    { path: '/admin/departments', label: 'Admin Departments Tab' },
    { path: '/admin/system', label: 'Admin System Tab' },
    { path: '/admin/data-import', label: 'Admin Data Import Tab' },
  ]

  for (const { path, label } of testRoutes) {
    it(`navigates to ${path} (${label}) without 404`, () => {
      const { container } = renderAppRoute(path)
      expect(screen.queryByText('Page not found')).not.toBeInTheDocument()
      expect(screen.queryByText('404')).not.toBeInTheDocument()
      expect(container).toBeDefined()
    })
  }
})
