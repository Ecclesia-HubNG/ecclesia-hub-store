'use client'

import { useState, useTransition, useMemo } from 'react'
import { setBestseller } from '@/lib/actions/products'

type Product = {
  id: string
  name: string
  thumbnail: string | null
  price: number
  is_active: boolean
  is_bestseller: boolean
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
        </svg>
      )}
    </div>
  )
}

export default function BestSellersManager({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'added' | 'all'>('added')

  const bestsellers = useMemo(() => products.filter(p => p.is_bestseller), [products])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    const pool = q ? products : (tab === 'added' ? bestsellers : products)
    return q ? pool.filter(p => p.name.toLowerCase().includes(q)) : pool
  }, [products, bestsellers, search, tab])

  function toggle(id: string, current: boolean) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_bestseller: !current } : p))
    setPendingIds(s => new Set(s).add(id))
    startTransition(async () => {
      await setBestseller(id, !current)
      setPendingIds(s => { const n = new Set(s); n.delete(id); return n })
    })
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex items-center gap-4 px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{bestsellers.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Best Sellers</p>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total products</p>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => { setTab('added'); setSearch('') }}
            className={`px-4 py-2 font-medium transition-colors ${tab === 'added' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            Best Sellers ({bestsellers.length})
          </button>
          <button
            type="button"
            onClick={() => { setTab('all'); setSearch('') }}
            className={`px-4 py-2 font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${tab === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            All Products ({products.length})
          </button>
        </div>

        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            {search
              ? 'No products match your search.'
              : tab === 'added'
              ? 'No best sellers yet — search or switch to All Products to add some.'
              : 'No products found.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(product => {
              const isPending = pendingIds.has(product.id)
              return (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <Thumb src={product.thumbnail} alt={product.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">₦{product.price.toLocaleString()}</p>
                  </div>
                  {product.is_bestseller && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-full shrink-0">
                      BEST SELLER
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggle(product.id, product.is_bestseller)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                      product.is_bestseller
                        ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30'
                        : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {isPending ? '…' : product.is_bestseller ? 'Remove' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
