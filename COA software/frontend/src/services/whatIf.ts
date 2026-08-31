import { apiClient } from './api'
import type { ApiResponse } from '../types/api'
import type {
  SimulationScenarioItem,
  ScenarioResult
} from '../types/whatIf'

export const whatIfService = {
  /**
   * Retrieves all What-If scenarios.
   */
  async getScenarios(): Promise<ApiResponse<SimulationScenarioItem[]>> {
    const res = await apiClient.get<ApiResponse<SimulationScenarioItem[]>>('/simulation/scenarios')
    return res.data
  },

  /**
   * Creates a new What-If scenario snapshot.
   */
  async createScenario(payload: {
    name: string
    description?: string
    corridor_id?: string
    parameters?: Record<string, any>
  }): Promise<ApiResponse<SimulationScenarioItem>> {
    const res = await apiClient.post<ApiResponse<SimulationScenarioItem>>('/simulation/scenarios', payload)
    return res.data
  },

  /**
   * Updates scenario parameters.
   */
  async updateScenario(
    id: string,
    payload: {
      name?: string
      description?: string
      parameters?: Record<string, any>
    }
  ): Promise<ApiResponse<SimulationScenarioItem>> {
    const res = await apiClient.put<ApiResponse<SimulationScenarioItem>>(`/simulation/scenarios/${id}`, payload)
    return res.data
  },

  /**
   * Deletes a scenario.
   */
  async deleteScenario(id: string): Promise<ApiResponse<{ scenario_id: string; deleted: boolean }>> {
    const res = await apiClient.delete<ApiResponse<{ scenario_id: string; deleted: boolean }>>(`/simulation/scenarios/${id}`)
    return res.data
  },

  /**
   * Validates scenario parameters.
   */
  async validateScenario(id: string): Promise<ApiResponse<{ scenario_id: string; is_valid: boolean; conflicts: string[] }>> {
    const res = await apiClient.post<ApiResponse<{ scenario_id: string; is_valid: boolean; conflicts: string[] }>>(`/simulation/scenarios/${id}/validate`)
    return res.data
  },

  /**
   * Runs What-If analysis.
   */
  async runScenario(id: string): Promise<ApiResponse<ScenarioResult>> {
    const res = await apiClient.post<ApiResponse<ScenarioResult>>(`/simulation/scenarios/${id}/run`)
    return res.data
  },

  /**
   * Duplicates a scenario.
   */
  async duplicateScenario(id: string): Promise<ApiResponse<SimulationScenarioItem>> {
    const res = await apiClient.post<ApiResponse<SimulationScenarioItem>>(`/simulation/scenarios/${id}/duplicate`)
    return res.data
  },

  /**
   * Compares multiple scenarios.
   */
  async compareScenarios(scenarioIds: string[]): Promise<ApiResponse<any>> {
    const res = await apiClient.post<ApiResponse<any>>('/simulation/scenarios/compare', {
      scenario_ids: scenarioIds
    })
    return res.data
  }
}
