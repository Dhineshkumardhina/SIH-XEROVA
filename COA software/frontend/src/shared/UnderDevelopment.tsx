import { Construction } from 'lucide-react'

export default function UnderDevelopment({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-6">
        <Construction className="w-8 h-8 text-orange-400" />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
        {moduleName}
      </h1>
      <p className="text-slate-400 max-w-md mx-auto">
        This module is currently under development. It will connect to the Unified Data Hub to provide complete operations coverage.
      </p>
    </div>
  )
}
