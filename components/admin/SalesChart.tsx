'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type DataPoint = { date: string; revenue: number; orders: number }

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      <p className="text-[#6B1A2A] dark:text-[#D4849A]">
        Revenue: {payload[0]?.value?.toLocaleString('en', { minimumFractionDigits: 2 })}
      </p>
      <p className="text-gray-400">{payload[1]?.value} orders</p>
    </div>
  )
}

export function SalesChart({ data }: { data: DataPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6B1A2A" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6B1A2A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => (v === 0 ? '0' : `${(v / 1000).toFixed(0)}k`)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#6B1A2A"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#6B1A2A' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
