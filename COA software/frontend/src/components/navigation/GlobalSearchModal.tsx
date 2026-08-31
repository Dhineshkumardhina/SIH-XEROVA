import React, { useState, useEffect } from 'react'
import { Search, Train, Wrench, AlertTriangle, Layers, ArrowRight, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

interface SearchItem {
  id: string
  title: string
  subtitle: string
  category: 'Assets' | 'Maintenance' | 'Defects' | 'Trains' | 'Corridors' | 'Blocks'
  path: string
}

const sampleSearchIndex: SearchItem[] = [
  { id: '1', title: 'Point Machine PM-NDLS-101', subtitle: 'Track Signaling • North Yard', category: 'Assets', path: '/assets' },
  { id: '2', title: 'Ultrasonic Track Flaw Testing', subtitle: 'Overdue • Track Dept', category: 'Maintenance', path: '/maintenance/overdue' },
  { id: '3', title: 'OHE Catenary Dropper Sag', subtitle: 'Critical Severity • Sector 4', category: 'Defects', path: '/defects' },
  { id: '4', title: '12952 Mumbai Tejas Rajdhani', subtitle: 'Scheduled Passenger • Down Line', category: 'Trains', path: '/trains' },
  { id: '5', title: 'Delhi - Kanpur Main Corridor', subtitle: 'Distance 440 km • High Density', category: 'Corridors', path: '/corridors' },
  { id: '6', title: 'Multi-Department Block C-01', subtitle: 'Approved 240min window', category: 'Blocks', path: '/blocks' },
]

export const GlobalSearchModal: React.FC = () => {
  const { searchOpen, setSearchOpen } = useUIStore()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, setSearchOpen])

  if (!searchOpen) return null

  const filtered = query.trim()
    ? sampleSearchIndex.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : sampleSearchIndex.slice(0, 4)

  const handleSelect = (path: string) => {
    setSearchOpen(false)
    setQuery('')
    navigate(path)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Assets':
        return <Layers className="w-4 h-4 text-blue-500" />
      case 'Maintenance':
        return <Wrench className="w-4 h-4 text-amber-500" />
      case 'Defects':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'Trains':
        return <Train className="w-4 h-4 text-emerald-500" />
      default:
        return <Search className="w-4 h-4 text-slate-400" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setSearchOpen(false)}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search railway assets, tasks, defects, trains, corridors... (Press Esc to exit)"
            autoFocus
            className="w-full px-3 py-4 text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching records found for "{query}"
            </div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.path)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 group-hover:text-blue-500 transition-colors">
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  )
}

export default GlobalSearchModal
