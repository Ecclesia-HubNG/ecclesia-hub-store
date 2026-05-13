'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Result = {
  type: 'product' | 'order'
  id: string
  title: string
  sub: string
  href: string
  thumbnail?: string | null
}

export function AdminSearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ⌘K / Ctrl+K to focus
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const [{ data: products }, { data: orders }] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, price, thumbnail, slug')
          .ilike('name', `%${query}%`)
          .limit(5),
        supabase
          .from('orders')
          .select('id, total, status, created_at')
          .ilike('id', `%${query}%`)
          .limit(3),
      ])

      const mapped: Result[] = [
        ...(products ?? []).map(p => ({
          type: 'product' as const,
          id: p.id,
          title: p.name,
          sub: `${p.price?.toLocaleString('en', { minimumFractionDigits: 2 })}`,
          href: `/admin/products/${p.id}/edit`,
          thumbnail: p.thumbnail,
        })),
        ...(orders ?? []).map(o => ({
          type: 'order' as const,
          id: o.id,
          title: `Order #${o.id.slice(0, 8).toUpperCase()}`,
          sub: `${o.status} · ${o.total?.toLocaleString('en', { minimumFractionDigits: 2 })}`,
          href: `/admin/orders`,
        })),
      ]

      setResults(mapped)
      setOpen(mapped.length > 0)
      setActive(-1)
      setLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function navigate(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) navigate(results[active].href)
  }

  return (
    <div ref={wrapRef} className="relative w-full max-w-lg mx-auto">
      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products, orders… (⌘K)"
          className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#6B1A2A] focus:border-transparent transition-shadow"
        />
        {loading && (
          <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {results.map((r, i) => (
            <button
              key={r.id}
              onClick={() => navigate(r.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                i === active ? 'bg-gray-50 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'
              } ${i > 0 ? 'border-t border-gray-100 dark:border-white/5' : ''}`}
            >
              {r.type === 'product' ? (
                r.thumbnail ? (
                  <img src={r.thumbnail} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 shrink-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5" />
                    </svg>
                  </div>
                )
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[#4A0F1C]/10 dark:bg-[#4A0F1C]/30 shrink-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#6B1A2A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                  </svg>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.title}</p>
                <p className="text-xs text-gray-400 capitalize">{r.sub}</p>
              </div>
              <span className="ml-auto text-xs text-gray-300 dark:text-gray-600 shrink-0 capitalize">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
