import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Home,
} from 'lucide-react'
import { useDemoStore, DEMO_STEPS } from '../../store/demoStore'

export const DemoGuidedNav: React.FC = () => {
  const navigate = useNavigate()
  const {
    isDemoActive,
    currentStepIndex,
    completedSteps,
    stepError,
    isStepLoading,
    nextStep,
    prevStep,
    goToStep,
    exitDemoMode,
    retryCurrentStep,
    clearStepError,
  } = useDemoStore()

  if (!isDemoActive) return null

  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === DEMO_STEPS.length - 1
  const nextStepItem = !isLastStep ? DEMO_STEPS[currentStepIndex + 1] : null

  return (
    <div
      aria-label="SIH Demo Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-auto"
    >
      {/* Presentation Safety Error Banner */}
      {stepError && (
        <div className="bg-red-950/95 border-t border-b border-red-500/60 px-4 py-2.5 backdrop-blur text-xs text-red-200 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
            <div>
              <span className="font-bold text-red-100">DEMO OPERATION FAILED:</span>{' '}
              <span className="text-red-200/90">{stepError}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => retryCurrentStep(navigate)}
              disabled={isStepLoading}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isStepLoading ? 'animate-spin' : ''}`} />
              RETRY
            </button>
            <button
              onClick={() => {
                clearStepError()
                navigate('/demo')
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              RETURN TO DASHBOARD
            </button>
            <button
              onClick={clearStepError}
              className="p-1 rounded text-red-400 hover:text-red-200 hover:bg-red-900/50"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Guided Control Dock */}
      <div className="bg-white/95 dark:bg-slate-950/95 border-t border-slate-200 dark:border-blue-500/40 shadow-2xl backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Left: Step Info & Current/Next Details */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-400/40 text-blue-700 dark:text-blue-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                DEMO PROGRESS: {currentStep.shortCode}
              </div>
              <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                ({currentStep.id} / {DEMO_STEPS.length})
              </span>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  {currentStep.name}
                </span>
                <span title="Actual Application Data Active">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </span>
              </div>
              <p className="hidden lg:block text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                {currentStep.description}
              </p>
            </div>
          </div>

          {/* Center: Interactive 10-Step Progress Strip */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {DEMO_STEPS.map((s, idx) => {
              const isCurrent = currentStepIndex === idx
              const isCompleted = completedSteps.includes(idx)

              return (
                <button
                  key={s.id}
                  onClick={() => goToStep(idx, navigate)}
                  title={`${s.shortCode} — ${s.name}: ${s.description}`}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-300'
                      : isCompleted
                      ? 'bg-emerald-50 dark:bg-slate-800/90 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-slate-800 border border-emerald-300 dark:border-emerald-500/30'
                      : 'bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  ) : (
                    <span>{s.shortCode.split(' ')[0]}</span>
                  )}
                  <span className="hidden min-[1400px]:inline truncate max-w-[75px]">
                    {s.name}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Right: Next Step Preview & Quick Navigation Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            {nextStepItem && (
              <div className="hidden sm:flex flex-col text-right mr-1">
                <span className="text-[9px] uppercase font-mono text-slate-500 dark:text-slate-400 tracking-wider">Next</span>
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                  {nextStepItem.name}
                </span>
              </div>
            )}

            {/* PREVIOUS Button */}
            <button
              onClick={() => prevStep(navigate)}
              disabled={isFirstStep}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isFirstStep
                  ? 'opacity-40 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              BACK
            </button>

            {/* NEXT DEMO STEP / FINISH DEMO Button */}
            <button
              onClick={() => {
                if (isLastStep) {
                  exitDemoMode()
                } else {
                  nextStep(navigate)
                }
              }}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md border border-blue-400/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isLastStep ? 'FINISH DEMO' : 'NEXT STEP'}</span>
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>

            {/* EXIT DEMO Button */}
            <button
              onClick={exitDemoMode}
              title="Exit Demo Mode"
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-300 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-500/40 flex items-center gap-1 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXIT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DemoGuidedNav
