'use client'

import { useState } from 'react'

type Option = { value: string; price?: number | null }
type Variant = { name: string; options: Option[] }

function fmt(n: number) {
  return `₦${n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function VariantSelector({ variants }: { variants: Variant[] }) {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(variants.map(v => [v.name, v.options[0]?.value ?? '']))
  )

  if (!variants.length) return null

  return (
    <div className="space-y-4 mb-6">
      {variants.map(v => (
        <div key={v.name}>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {v.name}
            {selected[v.name] && (
              <span className="font-normal text-gray-400 dark:text-gray-500 ml-1.5">
                — {selected[v.name]}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {v.options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(prev => ({ ...prev, [v.name]: opt.value }))}
                className={`px-3.5 py-1.5 rounded-lg text-sm border transition-all ${
                  selected[v.name] === opt.value
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {opt.value}
                {opt.price != null && (
                  <span className={`ml-1.5 text-xs ${
                    selected[v.name] === opt.value
                      ? 'text-white/70 dark:text-gray-900/60'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {fmt(opt.price)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
