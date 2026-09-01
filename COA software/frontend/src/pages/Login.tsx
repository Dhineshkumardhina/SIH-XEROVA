import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Train, Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Checkbox } from '../components/ui/Checkbox'

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('control')
  const [password, setPassword] = useState('RailoptDemo@2026')
  const [rememberMe, setRememberMe] = useState(true)
  const { login, isLoading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const success = await login(identifier, password)
    if (success) {
      navigate(from, { replace: true })
    }
  }

  const handleDemoAccount = (demoUser: string) => {
    setIdentifier(demoUser)
    setPassword('RailoptDemo@2026')
    clearError()
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 text-slate-900">
      {/* Left Brand Panel */}
      <div className="lg:col-span-7 bg-slate-50 text-slate-900 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-r border-slate-200">
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Train className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">RAILOPT AI</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Railway Operations Command</p>
          </div>
        </div>

        {/* Center Mission Statement */}
        <div className="relative z-10 my-12 space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            AI-Powered Railway Block Planning
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Intelligent Blocks. Maximum Availability. Reliable Operations.
          </h2>

          <p className="text-sm text-slate-600 leading-relaxed">
            Unifying Traffic Management (TMS), Smart Track Maintenance (SMMS), Traction (TDMS),
            and Bridge systems into a single predictive block planning engine for high-density railway corridors.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div>
              <p className="text-2xl font-bold text-blue-600">35%</p>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Downtime Reduction</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">100%</p>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Conflict Prevention</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">4x</p>
              <p className="text-[11px] text-slate-500 font-medium uppercase">Bundling Efficiency</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-200">
          <span>Indian Railways Operations Support</span>
          <span className="font-mono text-[10px] text-slate-600 font-semibold">SYNTHETIC DEMO ENVIRONMENT</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="lg:col-span-5 p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-white">
        <div className="max-w-md w-full mx-auto my-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to console</h2>
            <p className="text-xs text-slate-500 mt-1">
              Enter your railway divisional credentials to access operations
            </p>
          </div>

          {/* Quick Demo Persona Chips */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
              Quick Test Personas:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoAccount('control')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-blue-600 cursor-pointer"
              >
                Control Officer
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccount('engineering')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-blue-600 cursor-pointer"
              >
                Engineering Officer
              </button>
              <button
                type="button"
                onClick={() => handleDemoAccount('admin')}
                className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-blue-600 cursor-pointer"
              >
                Super Admin
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Official Email"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. control or user@railopt.gov.in"
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="flex items-center justify-between text-xs">
              <Checkbox
                label="Remember my credentials"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-slate-500 hover:underline cursor-pointer">Forgot password?</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              SIGN IN
            </Button>
          </form>
        </div>

        {/* Bottom Synthetic Disclaimer */}
        <div className="text-center text-[10px] text-slate-400 pt-8">
          Demonstration Environment — Synthetic Data • Not connected to live CRIS/IRCTC servers
        </div>
      </div>
    </div>
  )
}

export default LoginPage
