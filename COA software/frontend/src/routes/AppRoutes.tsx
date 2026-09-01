 import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import ProtectedRoute from '../auth/ProtectedRoute'

// Pages
import LoginPage from '../pages/Login'
import DashboardPage from '../pages/Dashboard'
import AssetsPage from '../pages/Assets'
import AssetDetail from '../pages/assets/AssetDetail'

// Maintenance Pages
import MaintenanceDashboard from '../pages/maintenance/MaintenanceDashboard'
import MaintenanceList from '../pages/maintenance/MaintenanceList'
import MaintenanceOverdue from '../pages/maintenance/MaintenanceOverdue'
import MaintenanceCritical from '../pages/maintenance/MaintenanceCritical'
import MaintenanceCalendar from '../pages/maintenance/MaintenanceCalendar'
import MaintenanceDetails from '../pages/maintenance/MaintenanceDetails'

// Defect Pages
import DefectDashboard from '../pages/defects/DefectDashboard'
import DefectList from '../pages/defects/DefectList'
import DefectCritical from '../pages/defects/DefectCritical'
import DefectOverdue from '../pages/defects/DefectOverdue'
import DefectDetails from '../pages/defects/DefectDetails'

import TrainOperationsDashboard from '../pages/trains/TrainOperationsDashboard'
import TrainList from '../pages/trains/TrainList'
import TrainDetail from '../pages/trains/TrainDetail'
import CorridorsPage from '../pages/Corridors'
import CorridorMapPage from '../pages/corridors/CorridorMapPage'
import CorridorDetailPage from '../pages/corridors/CorridorDetailPage'
import BlocksPage from '../pages/Blocks'
import BlockRequestDetail from '../pages/blocks/BlockRequestDetail'
import AIPlannerPage from '../pages/ai/AIPlannerPage'
import AIPriorityDashboard from '../pages/ai/AIPriorityDashboard'
import AIPriorityDetail from '../pages/ai/AIPriorityDetail'
import AssetRiskDashboard from '../pages/ai/AssetRiskDashboard'
import SimulationPage from '../pages/Simulation'
import AnalyticsPage from '../pages/Analytics'
import ReportsPage from '../pages/Reports'
import AdminPage from '../pages/Admin'
import LiveOperationsPage from '../pages/LiveOperations'
import NotificationsPage from '../pages/NotificationsPage'
import AuditPage from '../pages/AuditPage'
import ArchitecturePage from '../pages/ArchitecturePage'
import OptimizationResultPage from '../pages/planner/OptimizationResultPage'
import DemoPresentationPage from '../pages/DemoPresentationPage'
import NotFoundPage from '../pages/NotFound'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Main Application Shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/demo" element={<DemoPresentationPage />} />

        {/* Assets Hierarchy */}
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/assets/tracks" element={<AssetsPage subType="tracks" />} />
        <Route path="/assets/signals" element={<AssetsPage subType="signals" />} />
        <Route path="/assets/telecom" element={<AssetsPage subType="telecom" />} />
        <Route path="/assets/ohe" element={<AssetsPage subType="ohe" />} />
        <Route path="/assets/:assetId" element={<AssetDetail />} />

        {/* Maintenance Hierarchy */}
        {/* Maintenance Hierarchy */}
        <Route path="/maintenance" element={<MaintenanceDashboard />} />
        <Route path="/maintenance/tasks" element={<MaintenanceList />} />
        <Route path="/maintenance/tasks/:taskId" element={<MaintenanceDetails />} />
        <Route path="/maintenance/overdue" element={<MaintenanceOverdue />} />
        <Route path="/maintenance/critical" element={<MaintenanceCritical />} />
        <Route path="/maintenance/calendar" element={<MaintenanceCalendar />} />

        {/* Defects Hierarchy */}
        <Route path="/defects" element={<DefectDashboard />} />
        <Route path="/defects/list" element={<DefectList />} />
        <Route path="/defects/critical" element={<DefectCritical />} />
        <Route path="/defects/overdue" element={<DefectOverdue />} />
        <Route path="/defects/:defectId" element={<DefectDetails />} />

        {/* Trains Hierarchy */}
        <Route path="/trains" element={<TrainOperationsDashboard />} />
        <Route path="/trains/list" element={<TrainList />} />
        <Route path="/trains/:id" element={<TrainDetail />} />

        {/* Corridors Hierarchy */}
        <Route path="/corridors" element={<CorridorsPage />} />
        <Route path="/corridors/map" element={<CorridorMapPage />} />
        <Route path="/corridors/:corridorId" element={<CorridorDetailPage />} />

        {/* Operations & Real-Time Feed */}
        <Route path="/operations" element={<LiveOperationsPage />} />
        <Route path="/operations/live" element={<LiveOperationsPage />} />
        <Route path="/conflicts" element={<BlocksPage initialTab="conflicts" />} />

        {/* Blocks Hierarchy */}
        <Route path="/blocks" element={<BlocksPage />} />
        <Route path="/blocks/requests" element={<BlocksPage initialTab="requests" />} />
        <Route path="/blocks/requests/:requestId" element={<BlockRequestDetail />} />
        <Route path="/blocks/pending" element={<BlocksPage initialTab="pending" />} />
        <Route path="/blocks/approved" element={<BlocksPage initialTab="approved" />} />
        <Route path="/blocks/conflicts" element={<BlocksPage initialTab="conflicts" />} />

        {/* AI Hierarchy */}
        <Route path="/ai" element={<AIPlannerPage subModule="ai" />} />
        <Route path="/ai/planner" element={<AIPlannerPage subModule="ai" />} />
        <Route path="/ai/priority" element={<AIPriorityDashboard />} />
        <Route path="/ai/priority/:taskId" element={<AIPriorityDetail />} />
        <Route path="/ai/risk" element={<AssetRiskDashboard />} />
        <Route path="/ai/recommendations" element={<AIPlannerPage subModule="recommendations" />} />

        {/* Alias and List Routes */}
        <Route path="/maintenance/list" element={<MaintenanceList />} />
        <Route path="/assets/list" element={<AssetsPage />} />
        <Route path="/blocks/list" element={<BlocksPage />} />

        {/* Planner Hierarchy */}
        <Route path="/planner" element={<AIPlannerPage subModule="ai" />} />
        <Route path="/planner/ai" element={<AIPlannerPage subModule="ai" />} />
        <Route path="/planner/optimization-result" element={<OptimizationResultPage />} />
        <Route path="/planner/daily" element={<AIPlannerPage subModule="daily" />} />
        <Route path="/planner/weekly" element={<AIPlannerPage subModule="weekly" />} />
        <Route path="/planner/monthly" element={<AIPlannerPage subModule="monthly" />} />

        {/* Simulation Hierarchy */}
        <Route path="/simulation" element={<SimulationPage subModule="digital-twin" />} />
        <Route path="/simulation/digital-twin" element={<SimulationPage subModule="digital-twin" />} />
        <Route path="/simulation/scenarios" element={<SimulationPage subModule="scenarios" />} />
        <Route path="/simulation/results" element={<SimulationPage subModule="results" />} />

        {/* Analytics Hierarchy */}
        <Route path="/analytics" element={<AnalyticsPage subModule="assets" />} />
        <Route path="/analytics/assets" element={<AnalyticsPage subModule="assets" />} />
        <Route path="/analytics/blocks" element={<AnalyticsPage subModule="blocks" />} />
        <Route path="/analytics/maintenance" element={<AnalyticsPage subModule="maintenance" />} />
        <Route path="/analytics/train-impact" element={<AnalyticsPage subModule="train-impact" />} />

        {/* Reports Hierarchy */}
        <Route path="/reports" element={<ReportsPage frequency="daily" />} />
        <Route path="/reports/daily" element={<ReportsPage frequency="daily" />} />
        <Route path="/reports/weekly" element={<ReportsPage frequency="weekly" />} />
        <Route path="/reports/monthly" element={<ReportsPage frequency="monthly" />} />

        {/* Notifications & Audit */}
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/audit" element={<AuditPage />} />
        <Route path="/admin/audit" element={<AuditPage />} />

        {/* System Architecture Blueprint */}
        <Route path="/architecture" element={<ArchitecturePage />} />

        {/* Admin Hierarchy & Aliases */}
        <Route path="/admin" element={<AdminPage initialTab="users" />} />
        <Route path="/admin/users" element={<AdminPage initialTab="users" />} />
        <Route path="/admin/roles" element={<AdminPage initialTab="roles" />} />
        <Route path="/admin/departments" element={<AdminPage initialTab="departments" />} />
        <Route path="/admin/system" element={<AdminPage initialTab="system" />} />
        <Route path="/admin/data-import" element={<AdminPage initialTab="data-import" />} />
        <Route path="/settings" element={<AdminPage initialTab="system" />} />
        <Route path="/users" element={<AdminPage initialTab="users" />} />
        <Route path="/roles" element={<AdminPage initialTab="roles" />} />
        <Route path="/departments" element={<AdminPage initialTab="departments" />} />
      </Route>

      {/* 404 Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
