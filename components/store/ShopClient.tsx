'use client'

import { useState, useMemo } from 'react'
import ProductCard from '@/components/store/ProductCard'

type Category = { id: string; name: string; slug: string }

type Product = {
  id: string
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  thumbnail: string | null
  stock: number
  category_id: string | null
  is_featured: boolean
  categories: { name: string } | null
}

type SortBy = 'newest' | 'price_asc' | 'price_desc' | 'featured'

const SORT_LABELS: Record<SortBy, string> = {
  newest: 'Newest',
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
  featured: 'Featured first',
}

export default function ShopClient({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const filtered = useMemo(() => {
    const result = products.filter(p => {
      if (categoryId && p.category_id !== categoryId) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q)) return false
      }
      return true
    })

    if (sortBy === 'price_asc') return [...result].sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') return [...result].sort((a, b) => b.price - a.price)
    if (sortBy === 'featured') return [...result].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    return result
  }, [products, categoryId, search, sortBy])

  const hasFilters = !!categoryId || !!search
  const activeCategory = categories.find(c => c.id === categoryId)

  return (
    <div>
      {/* Banner */}
      <div className="bg-[#4A0F1C]/[0.04] dark:bg-[#4A0F1C]/25 border-b border-[#4A0F1C]/10 dark:border-[#4A0F1C]/30">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-1.5">
            {activeCategory ? activeCategory.name : 'Collection'}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {activeCategory ? activeCategory.name : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
            Bibles, books, and resources for your faith journey
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Filters row */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!categoryId ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryId === cat.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            {showSortDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />}
            <button
              type="button"
              onClick={() => setShowSortDropdown(p => !p)}
              className="flex items-center gap-2 px-3.5 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              {SORT_LABELS[sortBy]}
              <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showSortDropdown && (
              <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
                {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setSortBy(val); setShowSortDropdown(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${sortBy === val ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {label}
                    {sortBy === val && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/30 dark:focus:ring-[#4A0F1C]/50 focus:border-[#4A0F1C]/30 transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Count + clear */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {activeCategory ? ` in ${activeCategory.name}` : ''}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setCategoryId(null); setSearch('') }}
              className="text-xs text-gray-400 underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {!filtered.length ? (
          <div className="text-center py-28 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-900 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No products found</p>
            <p className="text-sm text-gray-400 dark:text-gray-600 mb-5">
              {search ? `No results for "${search}"` : 'No products in this category yet'}
            </p>
            <button
              type="button"
              onClick={() => { setCategoryId(null); setSearch('') }}
              className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-full hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
            >
              Browse all products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
