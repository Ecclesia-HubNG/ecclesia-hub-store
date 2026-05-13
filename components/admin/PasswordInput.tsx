'use client'

import { useState } from 'react'

type Rule = { label: string; test: (v: string) => boolean }

const RULES: Rule[] = [
  { label: 'At least 8 characters', test: v => v.length >= 8 },
  { label: 'One uppercase letter', test: v => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: v => /[a-z]/.test(v) },
  { label: 'One number', test: v => /[0-9]/.test(v) },
  { label: 'One special character', test: v => /[^A-Za-z0-9]/.test(v) },
]

function strength(value: string): { score: number; label: string; color: string } {
  const passed = RULES.filter(r => r.test(value)).length
  if (!value) return { score: 0, label: '', color: '' }
  if (passed <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' }
  if (passed === 3) return { score: 2, label: 'Fair', color: 'bg-amber-400' }
  if (passed === 4) return { score: 3, label: 'Good', color: 'bg-blue-500' }
  return { score: 4, label: 'Strong', color: 'bg-green-500' }
}

export function PasswordInput({
  name,
  placeholder = '••••••••',
  autoComplete = 'current-password',
  showRules = false,
  required = true,
}: {
  name: string
  placeholder?: string
  autoComplete?: string
  showRules?: boolean
  required?: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [value, setValue] = useState('')

  const { score, label, color } = strength(value)

  return (
    <div className="space-y-2">
      {/* Input */}
      <div className="relative">
        <input
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-4 py-3 pr-11 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Strength bar — only when showRules and user has typed */}
      {showRules && value.length > 0 && (
        <div className="space-y-2.5">
          {/* Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex gap-1">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= score ? color : 'bg-gray-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className={`text-xs font-medium ${
              score === 1 ? 'text-red-500' :
              score === 2 ? 'text-amber-500' :
              score === 3 ? 'text-blue-500' :
              'text-green-500'
            }`}>
              {label}
            </span>
          </div>

          {/* Rules checklist */}
          <ul className="space-y-1">
            {RULES.map(rule => {
              const passed = rule.test(value)
              return (
                <li key={rule.label} className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    passed ? 'bg-green-500' : 'bg-gray-200 dark:bg-white/10'
                  }`}>
                    {passed && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <span className={`text-xs transition-colors ${
                    passed ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {rule.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
