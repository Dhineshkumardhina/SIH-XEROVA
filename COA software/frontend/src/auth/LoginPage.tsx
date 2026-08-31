import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Train, Eye, EyeOff, AlertCircle, Shield, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const DEMO_PERSONAS = [
  { label: 'Control Officer', username: 'control', role: 'CONTROL_OFFICER', desc: 'Full Traffic Control & Block Approval' },
  { label: 'Block Planner', username: 'planner', role: 'BLOCK_PLANNER', desc: 'Multi-Department Bundling & Optimizer' },
  { label: 'Engineering', username: 'engineering', role: 'ENGINEERING_OFFICER', desc: 'Civil & Track Department Blocks' },
  { label: 'Signal & Telecom', username: 'signal', role: 'SIGNAL_TELECOM_OFFICER', desc: 'Interlocking & Point Machines' },
  { label: 'Traction', username: 'traction', role: 'TRACTION_OFFICER', desc: 'OHE & Power Feeders' },
  { label: 'Viewer', username: 'viewer', role: 'VIEWER', desc: 'Read-only Operations Observer' },
  { label: 'Super Admin', username: 'admin', role: 'SUPER_ADMIN', desc: 'User & System Administration' },
]

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, clearError } = useAuthStore()

  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) return

    const success = await login(identifier, password)
    if (success) {
      navigate(from, { replace: true })
    }
  }

  const handleSelectPersona = (username: string) => {
    setIdentifier(username)
    setPassword('RailoptDemo@2026')
    clearError()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden py-12 px-4">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left / Login Form */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 shadow-2xl shadow-black/40">
            {/* Logo & Header */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/25">
                <Train className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">RAILOPT AI</h1>
              <p className="text-xs font-medium text-cyan-400 uppercase tracking-wider mt-0.5">
                AI-Powered Railway Block Planning
              </p>
              <p className="text-xs text-slate-400 italic mt-1">
                "Intelligent Blocks. Maximum Availability. Reliable Operations."
              </p>
            </div>

            {/* Synthetic Data Disclaimer Banner */}
            <div className="mb-6 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-amber-400 text-xs">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>DEMONSTRATION ENVIRONMENT:</strong> Synthetic Railway Data. For official evaluation.
              </span>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-slate-300 block mb-1.5">
                  Username or Email
                </span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. control or control@railopt.demo"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                />
              </label>

              <label className="block">
                <span className="text-xs font-medium text-slate-300 block mb-1.5">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-600 text-blue-500 focus:ring-blue-500/40 bg-slate-700"
                  />
                  <span className="text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Demo environment: Passwords reset automatically via seed script.')}
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="animate-pulse">Authenticating…</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-slate-500 mt-6">
              Indian Railways · Restricted Access · For Authorized Personnel Only
            </p>
          </div>
        </div>

        {/* Right / Demo Persona Quick-Fill */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Demo Persona Quick-Fill
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Click any role below to prefill credentials for prototype evaluation:
            </p>
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {DEMO_PERSONAS.map((p) => (
                <button
                  key={p.username}
                  type="button"
                  onClick={() => handleSelectPersona(p.username)}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    identifier === p.username
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                      : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{p.label}</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                      {p.username}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
