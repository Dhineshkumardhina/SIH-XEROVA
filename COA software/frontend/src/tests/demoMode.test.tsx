import { describe, it, expect, beforeEach, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useDemoStore, DEMO_STEPS } from '../store/demoStore'
import { DemoGuidedNav } from '../components/demo/DemoGuidedNav'

const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  )
}

describe('SIH Presentation Mode (Phase 33) Test Suite', () => {
  beforeEach(() => {
    localStorage.clear()
    useDemoStore.setState({
      isDemoActive: true,
      isPresentationMode: false,
      currentStepIndex: 0,
      completedSteps: [],
      stepError: null,
      isStepLoading: false,
    })
  })

  // Test 1: Store initialization and step count
  it('1. initializes demo store with 10 sequential presentation steps', () => {
    const store = useDemoStore.getState()
    expect(store.isDemoActive).toBe(true)
    expect(store.currentStepIndex).toBe(0)
    expect(DEMO_STEPS).toHaveLength(10)
    expect(DEMO_STEPS[0].name).toBe('FRAGMENTED DATA')
    expect(DEMO_STEPS[0].shortCode).toBe('01 DATA')
    expect(DEMO_STEPS[9].name).toBe('HUMAN APPROVAL')
    expect(DEMO_STEPS[9].shortCode).toBe('10 APPROVAL')
  })

  // Test 2: Next and Previous step progression
  it('2. advances step on nextStep and reverts step on prevStep', () => {
    const navigateMock = vi.fn()

    // Step 0 -> Step 1
    useDemoStore.getState().nextStep(navigateMock)
    expect(useDemoStore.getState().currentStepIndex).toBe(1)
    expect(useDemoStore.getState().completedSteps).toContain(0)
    expect(navigateMock).toHaveBeenCalledWith('/maintenance')

    // Step 1 -> Step 0
    useDemoStore.getState().prevStep(navigateMock)
    expect(useDemoStore.getState().currentStepIndex).toBe(0)
    expect(navigateMock).toHaveBeenCalledWith('/demo')
  })

  // Test 3: Jump to step and route sync
  it('3. supports direct step jumping and route synchronization', () => {
    const navigateMock = vi.fn()

    // Jump to Step 7 (DIGITAL TWIN)
    useDemoStore.getState().goToStep(7, navigateMock)
    expect(useDemoStore.getState().currentStepIndex).toBe(7)
    expect(navigateMock).toHaveBeenCalledWith('/simulation/digital-twin')

    // Sync with route /simulation/results (BEFORE VS AFTER - Step Index 8)
    useDemoStore.getState().syncWithRoute('/simulation/results')
    expect(useDemoStore.getState().currentStepIndex).toBe(8)
  })

  // Test 4: Exit and toggle demo mode & presentation mode
  it('4. toggles and exits demo mode and presentation mode cleanly', () => {
    useDemoStore.getState().exitDemoMode()
    expect(useDemoStore.getState().isDemoActive).toBe(false)

    useDemoStore.getState().toggleDemoMode()
    expect(useDemoStore.getState().isDemoActive).toBe(true)

    useDemoStore.getState().togglePresentationMode()
    expect(useDemoStore.getState().isPresentationMode).toBe(true)
  })

  // Test 5: Error state & presentation safety retry
  it('5. handles backend failure error state and triggers retry', () => {
    const navigateMock = vi.fn()

    useDemoStore.getState().setStepError('OR-Tools optimization endpoint unreachable')
    expect(useDemoStore.getState().stepError).toBe('OR-Tools optimization endpoint unreachable')

    useDemoStore.getState().retryCurrentStep(navigateMock)
    expect(useDemoStore.getState().stepError).toBeNull()
    expect(navigateMock).toHaveBeenCalledWith('/demo')
  })

  // Test 6: DemoGuidedNav rendering current step and quick navigation controls
  it('6. renders DemoGuidedNav UI with current step details and quick controls', () => {
    renderWithRouter(<DemoGuidedNav />)

    expect(screen.getByText(/DEMO PROGRESS: 01 DATA/i)).toBeInTheDocument()
    expect(screen.getAllByText('FRAGMENTED DATA').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /NEXT STEP/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /BACK/i })).toBeInTheDocument()
    expect(screen.getByText('EXIT')).toBeInTheDocument()
  })

  // Test 7: DemoGuidedNav quick navigation button clicks
  it('7. triggers next step when NEXT STEP button is clicked', () => {
    renderWithRouter(<DemoGuidedNav />)

    const nextBtn = screen.getByRole('button', { name: /NEXT STEP/i })
    fireEvent.click(nextBtn)

    expect(useDemoStore.getState().currentStepIndex).toBe(1)
    expect(useDemoStore.getState().completedSteps).toContain(0)
  })

  // Test 8: Presentation safety error banner rendering and retry click in UI
  it('8. displays error banner and retry button when backend error occurs in UI', () => {
    useDemoStore.setState({ stepError: 'Corridor API service timeout' })
    renderWithRouter(<DemoGuidedNav />)

    expect(screen.getByText(/DEMO OPERATION FAILED:/i)).toBeInTheDocument()
    expect(screen.getByText(/Corridor API service timeout/i)).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /RETRY/i })
    fireEvent.click(retryBtn)

    expect(useDemoStore.getState().stepError).toBeNull()
  })
})
