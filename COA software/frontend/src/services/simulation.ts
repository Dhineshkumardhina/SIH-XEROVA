import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  ScenarioItem,
  SimulationState,
  SimulationEvent,
  SimulationMetrics
} from '../types/simulation'

export const simulationService = {
  /**
   * Retrieves predefined simulation scenarios.
   */
  async getScenarios(): Promise<ApiResponse<ScenarioItem[]>> {
    const res = await apiClient.get<ApiResponse<ScenarioItem[]>>('/simulation/predefined')
    return res.data
  },

  /**
   * Initializes a digital twin simulation session.
   */
  async runSimulation(payload: {
    scenario_id?: string
    plan_mode?: 'MANUAL_BASELINE' | 'AI_OPTIMIZED'
  }): Promise<ApiResponse<SimulationState>> {
    const res = await apiClient.post<ApiResponse<SimulationState>>('/simulation/run', payload)
    return res.data
  },

  /**
   * Gets state snapshot.
   */
  async getState(simulationId: string): Promise<ApiResponse<SimulationState>> {
    const res = await apiClient.get<ApiResponse<SimulationState>>(`/simulation/${simulationId}`)
    return res.data
  },

  /**
   * Starts or steps forward.
   */
  async step(simulationId: string, deltaMinutes = 5): Promise<ApiResponse<SimulationState>> {
    const res = await apiClient.post<ApiResponse<SimulationState>>(`/simulation/${simulationId}/step`, {
      delta_minutes: deltaMinutes
    })
    return res.data
  },

  /**
   * Pauses simulation.
   */
  async pause(simulationId: string): Promise<ApiResponse<SimulationState>> {
    const res = await apiClient.post<ApiResponse<SimulationState>>(`/simulation/${simulationId}/pause`)
    return res.data
  },

  /**
   * Resets simulation.
   */
  async reset(simulationId: string): Promise<ApiResponse<SimulationState>> {
    const res = await apiClient.post<ApiResponse<SimulationState>>(`/simulation/${simulationId}/reset`)
    return res.data
  },

  /**
   * Sets speed multiplier.
   */
  async setSpeed(simulationId: string, speedMultiplier: number): Promise<ApiResponse<SimulationState>> {
    const res = await apiClient.post<ApiResponse<SimulationState>>(`/simulation/${simulationId}/speed`, {
      speed_multiplier: speedMultiplier
    })
    return res.data
  },

  /**
   * Gets events log.
   */
  async getEvents(simulationId: string, limit = 50): Promise<ApiResponse<SimulationEvent[]>> {
    const res = await apiClient.get<ApiResponse<SimulationEvent[]>>(`/simulation/${simulationId}/events`, {
      params: { limit }
    })
    return res.data
  },

  /**
   * Gets metrics.
   */
  async getMetrics(simulationId: string): Promise<ApiResponse<SimulationMetrics>> {
    const res = await apiClient.get<ApiResponse<SimulationMetrics>>(`/simulation/${simulationId}/metrics`)
    return res.data
  }
}
