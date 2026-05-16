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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function SidebarSection({
  title, open, onToggle, children,
}: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{title}</p>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  )
}

function Checkbox({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group" onClick={() => onChange(!checked)}>
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${checked ? 'bg-[#4A0F1C] border-[#4A0F1C]' : 'border-gray-300 dark:border-gray-600 group-hover:border-gray-400'}`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        )}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300 select-none">{label}</span>
    </label>
  )
}

function Sidebar({
  categories, categoryId, setCategoryId,
  minPrice, setMinPrice, maxPrice, setMaxPrice,
  inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly,
  categoryCounts, priceFloor, priceCeil,
  hasFilters, clearFilters,
}: {
  categories: Category[]
  categoryId: string | null
  setCategoryId: (v: string | null) => void
  minPrice: string
  setMinPrice: (v: string) => void
  maxPrice: string
  setMaxPrice: (v: string) => void
  inStockOnly: boolean
  setInStockOnly: (v: boolean) => void
  onSaleOnly: boolean
  setOnSaleOnly: (v: boolean) => void
  categoryCounts: Record<string, number>
  priceFloor: number
  priceCeil: number
  hasFilters: boolean
  clearFilters: () => void
}) {
  const [open, setOpen] = useState({ category: true, price: true, availability: true })
  const toggle = (key: keyof typeof open) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  const totalCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <p className="text-base font-semibold text-gray-900 dark:text-white">Filter</p>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-[#6B1A2A] dark:text-[#D4849A] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Category */}
      <SidebarSection title="Category" open={open.category} onToggle={() => toggle('category')}>
        <ul className="space-y-0.5">
          <li>
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`flex items-center justify-between w-full px-2 py-2 rounded-lg text-sm transition-colors ${!categoryId ? 'bg-[#4A0F1C]/8 dark:bg-[#4A0F1C]/20 text-[#4A0F1C] dark:text-[#E8C4CB] font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
            >
              <span className="flex items-center gap-2">
                {!categoryId && <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C] dark:bg-[#D4849A] shrink-0" />}
                {categoryId && <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />}
                All Products
              </span>
              <span className="text-xs text-gray-400 tabular-nums">{totalCount}</span>
            </button>
          </li>
          {categories.map(cat => {
            const active = categoryId === cat.id
            return (
              <li key={cat.id}>
                <button
                  type="button"
                  onClick={() => setCategoryId(active ? null : cat.id)}
                  className={`flex items-center justify-between w-full px-2 py-2 rounded-lg text-sm transition-colors ${active ? 'bg-[#4A0F1C]/8 dark:bg-[#4A0F1C]/20 text-[#4A0F1C] dark:text-[#E8C4CB] font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <span className="flex items-center gap-2">
                    {active
                      ? <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C] dark:bg-[#D4849A] shrink-0" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />
                    }
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400 tabular-nums">{categoryCounts[cat.id] ?? 0}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </SidebarSection>

      {/* Price range */}
      <SidebarSection title="Price range" open={open.price} onToggle={() => toggle('price')}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 dark:text-gray-600 mb-1.5 block">Min (₦)</label>
            <input
              type="number"
              placeholder={priceFloor.toLocaleString()}
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              min={0}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            />
          </div>
          <div className="w-4 h-px bg-gray-200 dark:bg-gray-700 mt-5 shrink-0" />
          <div className="flex-1">
            <label className="text-[10px] text-gray-400 dark:text-gray-600 mb-1.5 block">Max (₦)</label>
            <input
              type="number"
              placeholder={priceCeil.toLocaleString()}
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min={0}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/40 transition-colors"
            />
          </div>
        </div>
        {(minPrice || maxPrice) && (
          <button
            type="button"
            onClick={() => { setMinPrice(''); setMaxPrice('') }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-2.5 transition-colors"
          >
            Clear price
          </button>
        )}
      </SidebarSection>

      {/* Availability */}
      <SidebarSection title="Availability" open={open.availability} onToggle={() => toggle('availability')}>
        <div className="space-y-3">
          <Checkbox checked={inStockOnly} onChange={setInStockOnly} label="In stock only" />
          <Checkbox checked={onSaleOnly} onChange={setOnSaleOnly} label="On sale" />
        </div>
      </SidebarSection>
    </div>
  )
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
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [inStockOnly, setInStockOnly] = useState(false)
  const [onSaleOnly, setOnSaleOnly] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    products.forEach(p => {
      if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1
    })
    return counts
  }, [products])

  const priceFloor = useMemo(() => (products.length ? Math.floor(Math.min(...products.map(p => p.price))) : 0), [products])
  const priceCeil = useMemo(() => (products.length ? Math.ceil(Math.max(...products.map(p => p.price))) : 0), [products])

  const filtered = useMemo(() => {
    const result = products.filter(p => {
      if (categoryId && p.category_id !== categoryId) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (minPrice && p.price < parseFloat(minPrice)) return false
      if (maxPrice && p.price > parseFloat(maxPrice)) return false
      if (inStockOnly && p.stock === 0) return false
      if (onSaleOnly && (!p.compare_at_price || p.compare_at_price <= p.price)) return false
      return true
    })
    if (sortBy === 'price_asc') return [...result].sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') return [...result].sort((a, b) => b.price - a.price)
    if (sortBy === 'featured') return [...result].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    return result
  }, [products, categoryId, search, minPrice, maxPrice, inStockOnly, onSaleOnly, sortBy])

  const hasFilters = !!(categoryId || search || minPrice || maxPrice || inStockOnly || onSaleOnly)
  const activeFilterCount = [!!categoryId, !!minPrice, !!maxPrice, inStockOnly, onSaleOnly].filter(Boolean).length
  const activeCategory = categories.find(c => c.id === categoryId)

  const clearFilters = () => {
    setCategoryId(null)
    setSearch('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setOnSaleOnly(false)
  }

  const activeChips: { key: string; label: string; remove: () => void }[] = [
    categoryId ? { key: 'cat', label: activeCategory?.name ?? 'Category', remove: () => setCategoryId(null) } : null,
    (minPrice || maxPrice) ? { key: 'price', label: `₦${minPrice || '0'} – ${maxPrice ? '₦' + maxPrice : 'any'}`, remove: () => { setMinPrice(''); setMaxPrice('') } } : null,
    inStockOnly ? { key: 'stock', label: 'In stock', remove: () => setInStockOnly(false) } : null,
    onSaleOnly ? { key: 'sale', label: 'On sale', remove: () => setOnSaleOnly(false) } : null,
  ].filter(Boolean) as { key: string; label: string; remove: () => void }[]

  const sidebarProps = {
    categories, categoryId, setCategoryId,
    minPrice, setMinPrice, maxPrice, setMaxPrice,
    inStockOnly, setInStockOnly, onSaleOnly, setOnSaleOnly,
    categoryCounts, priceFloor, priceCeil,
    hasFilters, clearFilters,
  }

  return (
    <div className="min-h-screen">
      {/* Slim banner */}
      <div className="bg-[#4A0F1C]/[0.04] dark:bg-[#4A0F1C]/20 border-b border-[#4A0F1C]/10 dark:border-[#4A0F1C]/30">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-1">
            {activeCategory ? activeCategory.name : 'Collection'}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {activeCategory ? activeCategory.name : 'All Products'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bibles, books, and resources for your faith journey
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Top bar */}
        <div className="flex items-center gap-3 mb-8">
          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden relative flex items-center gap-2 px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#4A0F1C] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 focus:border-[#4A0F1C]/30 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative shrink-0">
            {showSortDropdown && <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />}
            <button
              type="button"
              onClick={() => setShowSortDropdown(p => !p)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
              </svg>
              <span className="hidden sm:inline">{SORT_LABELS[sortBy]}</span>
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

        {/* Body — sidebar + main */}
        <div className="flex gap-10 items-start">

          {/* Desktop sidebar */}
          <aside className="hidden md:block w-60 shrink-0 sticky top-20">
            <Sidebar {...sidebarProps} />
          </aside>

          {/* Mobile sidebar overlay */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-950 overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-base font-semibold text-gray-900 dark:text-white">Filters</p>
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="px-5 py-4">
                  <Sidebar {...sidebarProps} />
                </div>
                <div className="px-5 pb-8 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors"
                  >
                    Show {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Count + active chips */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{filtered.length}</span>{' '}
                product{filtered.length !== 1 ? 's' : ''}
                {search && (
                  <span className="text-[#6B1A2A] dark:text-[#D4849A]"> for &ldquo;{search}&rdquo;</span>
                )}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeChips.map(chip => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.remove}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A0F1C]/8 dark:bg-[#4A0F1C]/20 text-[#4A0F1C] dark:text-[#E8C4CB] text-xs font-medium rounded-full hover:bg-[#4A0F1C]/15 dark:hover:bg-[#4A0F1C]/30 transition-colors"
                  >
                    {chip.label}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                ))}
              </div>
            )}

            {/* Grid */}
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filtered.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product as typeof product & { categories: { name: string } | null }}
                  />
                ))}
              </div>
            ) : (
              <div className="py-24 text-center">
                <svg className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p className="text-gray-400 dark:text-gray-600 font-medium">No products match your filters</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-sm text-[#6B1A2A] dark:text-[#D4849A] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
