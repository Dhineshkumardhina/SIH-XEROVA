import { create } from 'zustand'
import type { DashboardStats } from '../types/dashboard'
import type { BlockPlan } from '../types/block'
import type { MaintenanceTask } from '../types/maintenance'
import type { Asset } from '../types/asset'
import * as api from './api'

// ── Dashboard Store ─────────────────────────────────────────────────

interface DashboardState {
  stats: DashboardStats | null
  recommendations: BlockPlan[]
  priorityTasks: MaintenanceTask[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  recommendations: [],
  priorityTasks: [],
  loading: false,
  error: null,
  fetchAll: async () => {
    set({ loading: true, error: null })
    try {
      const [stats, recommendations, priorityTasks] = await Promise.all([
        api.fetchDashboardStats(),
        api.fetchRecommendations(),
        api.fetchPriorityTasks(),
      ])
      set({ stats, recommendations, priorityTasks, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))

// ── Block Plans Store ───────────────────────────────────────────────

interface BlocksState {
  plans: BlockPlan[]
  loading: boolean
  error: string | null
  fetchPlans: () => Promise<void>
  approvePlan: (id: string) => Promise<void>
}

export const useBlocksStore = create<BlocksState>((set, get) => ({
  plans: [],
  loading: false,
  error: null,
  fetchPlans: async () => {
    set({ loading: true, error: null })
    try {
      const plans = await api.fetchBlockPlans()
      set({ plans, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
  approvePlan: async (id: string) => {
    try {
      const updated = await api.approveBlockPlan(id)
      set({ plans: get().plans.map((p) => (p.id === id ? updated : p)) })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },
}))

// ── Asset Store ─────────────────────────────────────────────────────

interface AssetState {
  assets: Asset[]
  loading: boolean
  error: string | null
  fetchAssets: () => Promise<void>
}

export const useAssetStore = create<AssetState>((set) => ({
  assets: [],
  loading: false,
  error: null,
  fetchAssets: async () => {
    set({ loading: true, error: null })
    try {
      const assets = await api.fetchAssets()
      set({ assets, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))

// ── Task Store ──────────────────────────────────────────────────────

interface TaskState {
  tasks: MaintenanceTask[]
  loading: boolean
  error: string | null
  fetchTasks: () => Promise<void>
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  loading: false,
  error: null,
  fetchTasks: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await api.fetchTasks()
      set({ tasks, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },
}))

export { useUIStore } from '../store/uiStore'

