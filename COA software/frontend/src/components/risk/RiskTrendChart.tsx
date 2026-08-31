import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts'
import type { RiskHistoryItem } from '../../types/risk'

interface RiskTrendChartProps {
  history: RiskHistoryItem[]
  height?: number
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ history, height = 240 }) => {
  if (!history || history.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-slate-500 italic bg-slate-900/30 rounded-lg border border-slate-800">
        No historical risk predictions available.
      </div>
    )
  }

  // Format data ascending for time progression
  const chartData = [...history]
    .sort((a, b) => new Date(a.prediction_date).getTime() - new Date(b.prediction_date).getTime())
    .map((item) => {
      const d = new Date(item.prediction_date)
      const dateStr = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`
      return {
        date: dateStr,
        fullDate: item.prediction_date,
        riskScore: item.risk_score,
        riskLevel: item.risk_level,
        failureProb: Math.round(item.failure_probability * 100),
        horizon: item.horizon_days
      }
    })

  return (
    <div className="w-full">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              domain={[0, 100]}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  const score = Number(data.riskScore) || 0
                  return (
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 shadow-xl text-xs space-y-1">
                      <div className="font-semibold text-slate-200">{data.date}</div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="font-bold text-amber-400">{score.toFixed(1)} / 100</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-400">Status:</span>
                        <span
                          className={`font-bold ${
                            data.riskLevel === 'CRITICAL'
                              ? 'text-red-400'
                              : data.riskLevel === 'HIGH'
                              ? 'text-amber-400'
                              : data.riskLevel === 'MEDIUM'
                              ? 'text-yellow-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {data.riskLevel || 'LOW'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                        <span>Failure Est: {data.failureProb ?? 0}%</span>
                        <span>({data.horizon ?? 30}d horizon)</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" opacity={0.6} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" opacity={0.4} />
            <Line
              type="monotone"
              dataKey="riskScore"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1, stroke: '#0f172a' }}
              activeDot={{ r: 6, fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default RiskTrendChart
