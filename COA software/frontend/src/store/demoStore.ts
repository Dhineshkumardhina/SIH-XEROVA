import { create } from 'zustand'

export interface DemoStep {
  id: number
  shortCode: string
  name: string
  route: string
  description: string
}

export const DEMO_STEPS: DemoStep[] = [
  {
    id: 1,
    shortCode: '01 DATA',
    name: 'FRAGMENTED DATA',
    route: '/demo',
    description: 'Fragmented Subsystems (TMS, SMMS, TDMS, BDMS, COA) & Orchestration Architecture',
  },
  {
    id: 2,
    shortCode: '02 MAINTENANCE',
    name: 'MAINTENANCE INTELLIGENCE',
    route: '/maintenance',
    description: 'Department Priority Scoring, Critical Overdue Tasks & Asset Failure Risk',
  },
  {
    id: 3,
    shortCode: '03 TRAINS',
    name: 'TRAIN OPERATIONS',
    route: '/trains',
    description: 'Passenger & Goods Timetables, Corridor Density & Occupied Windows',
  },
  {
    id: 4,
    shortCode: '04 CORRIDOR',
    name: 'CORRIDOR AVAILABILITY',
    route: '/corridors',
    description: 'COR-A01 Station Topology, Asset Locations & Available Track Windows',
  },
  {
    id: 5,
    shortCode: '05 BLOCKS',
    name: 'BLOCK REQUESTS',
    route: '/blocks/requests',
    description: 'Isolated Department Demands (ENG 2h + SIG 1h + TRC 1.5h = 4.5h Baseline Occupation)',
  },
  {
    id: 6,
    shortCode: '06 AI',
    name: 'AI ANALYSIS',
    route: '/ai',
    description: 'AI Conflict Risk Scoring, Spatial-Temporal Overlay & Bundling Engine',
  },
  {
    id: 7,
    shortCode: '07 OPTIMIZATION',
    name: 'OPTIMIZATION RESULT',
    route: '/planner/optimization-result',
    description: 'Google OR-Tools CP-SAT Solver Execution & Feasible Options A/B/C',
  },
  {
    id: 8,
    shortCode: '08 SIMULATION',
    name: 'DIGITAL TWIN',
    route: '/simulation/digital-twin',
    description: '1D Kinematic Physics Simulation, Train Movements & Signal Aspect Rules',
  },
  {
    id: 9,
    shortCode: '09 IMPACT',
    name: 'BEFORE VS AFTER',
    route: '/simulation/results',
    description: '4.5h Baseline vs 2.0h Shared Block: 150m Downtime Saved & 0 Train Delays',
  },
  {
    id: 10,
    shortCode: '10 APPROVAL',
    name: 'HUMAN APPROVAL',
    route: '/blocks/approved',
    description: 'Chief Control Officer Review, Approve/Reject & Audit Log Token',
  },
]

const DEMO_STORAGE_KEY = 'railopt_demo_active'
const PRESENTATION_STORAGE_KEY = 'railopt_presentation_mode'

interface DemoState {
  isDemoActive: boolean
  isPresentationMode: boolean
  currentStepIndex: number
  completedSteps: number[]
  stepError: string | null
  isStepLoading: boolean

  setDemoActive: (active: boolean) => void
  toggleDemoMode: () => void
  setPresentationMode: (active: boolean) => void
  togglePresentationMode: () => void
  nextStep: (navigate: (path: string) => void) => void
  prevStep: (navigate: (path: string) => void) => void
  goToStep: (index: number, navigate: (path: string) => void) => void
  syncWithRoute: (pathname: string) => void
  setStepError: (error: string | null) => void
  clearStepError: () => void
  retryCurrentStep: (navigate: (path: string) => void) => void
  exitDemoMode: () => void
}

const getInitialDemoActive = (): boolean => {
  if (typeof window === 'undefined') return true
  const saved = localStorage.getItem(DEMO_STORAGE_KEY)
  if (saved !== null) return saved === 'true'
  return true
}

const getInitialPresentationMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(PRESENTATION_STORAGE_KEY) === 'true'
}

export const useDemoStore = create<DemoState>((set, get) => ({
  isDemoActive: getInitialDemoActive(),
  isPresentationMode: getInitialPresentationMode(),
  currentStepIndex: 0,
  completedSteps: [],
  stepError: null,
  isStepLoading: false,

  setDemoActive: (active: boolean) => {
    localStorage.setItem(DEMO_STORAGE_KEY, String(active))
    set({ isDemoActive: active, stepError: null })
  },

  toggleDemoMode: () => {
    const next = !get().isDemoActive
    localStorage.setItem(DEMO_STORAGE_KEY, String(next))
    set({ isDemoActive: next, stepError: null })
  },

  setPresentationMode: (active: boolean) => {
    localStorage.setItem(PRESENTATION_STORAGE_KEY, String(active))
    set({ isPresentationMode: active })
  },

  togglePresentationMode: () => {
    const next = !get().isPresentationMode
    localStorage.setItem(PRESENTATION_STORAGE_KEY, String(next))
    set({ isPresentationMode: next })
  },

  exitDemoMode: () => {
    localStorage.setItem(DEMO_STORAGE_KEY, 'false')
    set({ isDemoActive: false, stepError: null })
  },

  nextStep: (navigate) => {
    const { currentStepIndex, completedSteps } = get()
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1
      const updatedCompleted = Array.from(new Set([...completedSteps, currentStepIndex]))
      set({
        currentStepIndex: nextIdx,
        completedSteps: updatedCompleted,
        stepError: null,
      })
      navigate(DEMO_STEPS[nextIdx].route)
    }
  },

  prevStep: (navigate) => {
    const { currentStepIndex } = get()
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1
      set({
        currentStepIndex: prevIdx,
        stepError: null,
      })
      navigate(DEMO_STEPS[prevIdx].route)
    }
  },

  goToStep: (index, navigate) => {
    if (index >= 0 && index < DEMO_STEPS.length) {
      const { currentStepIndex, completedSteps } = get()
      const newCompleted = index > currentStepIndex
        ? Array.from(new Set([...completedSteps, currentStepIndex]))
        : completedSteps
      set({
        currentStepIndex: index,
        completedSteps: newCompleted,
        stepError: null,
      })
      navigate(DEMO_STEPS[index].route)
    }
  },

  syncWithRoute: (pathname) => {
    let idx = DEMO_STEPS.findIndex((step) => step.route === pathname)
    if (idx === -1 && (pathname === '/dashboard' || pathname === '/')) {
      idx = 0
    }
    if (idx !== -1 && idx !== get().currentStepIndex) {
      const { currentStepIndex, completedSteps } = get()
      const updatedCompleted = idx > currentStepIndex
        ? Array.from(new Set([...completedSteps, currentStepIndex]))
        : completedSteps
      set({
        currentStepIndex: idx,
        completedSteps: updatedCompleted,
        stepError: null,
      })
    }
  },

  setStepError: (error) => {
    set({ stepError: error, isStepLoading: false })
  },

  clearStepError: () => {
    set({ stepError: null })
  },

  retryCurrentStep: (navigate) => {
    const { currentStepIndex } = get()
    set({ stepError: null, isStepLoading: true })
    const targetRoute = DEMO_STEPS[currentStepIndex].route
    navigate(targetRoute)
    setTimeout(() => {
      set({ isStepLoading: false })
    }, 400)
  },
}))
