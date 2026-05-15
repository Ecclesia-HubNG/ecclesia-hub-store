'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { deleteProduct, duplicateProduct } from '@/lib/actions/products'
import { DeleteButton } from '@/components/admin/DeleteButton'
import { DuplicateButton } from '@/components/admin/DuplicateButton'

type Product = {
  id: string
  name: string
  slug: string
  thumbnail: string | null
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  categories: { name: string } | null
}

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured' | 'out_of_stock'

const statusLabels: Record<StatusFilter, string> = {
  all: 'All Status',
  active: 'Active',
  inactive: 'Inactive',
  featured: 'Featured',
  out_of_stock: 'Out of Stock',
}

function fmt(n: number) {
  return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400">
        Out of stock
      </span>
    )
  if (stock <= 5)
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
        {stock} left
      </span>
    )
  return <span className="text-sm text-gray-600 dark:text-gray-400">{stock.toLocaleString()}</span>
}

function exportToCSV(products: Product[]) {
  const headers = ['Name', 'Slug', 'Price', 'Compare At Price', 'Stock', 'Status', 'Featured', 'Category', 'Created At']
  const rows = products.map(p => [
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.slug}"`,
    p.price,
    p.compare_at_price ?? '',
    p.stock,
    p.is_active ? 'Active' : 'Inactive',
    p.is_featured ? 'Yes' : 'No',
    `"${p.categories?.name ?? ''}"`,
    p.created_at,
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ProductsManager({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)

  const total = products.length
  const inStock = products.filter(p => p.stock > 0).length
  const outOfStock = products.filter(p => p.stock === 0).length

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.slug.includes(q)) return false
      }
      if (status === 'active' && !p.is_active) return false
      if (status === 'inactive' && p.is_active) return false
      if (status === 'featured' && !p.is_featured) return false
      if (status === 'out_of_stock' && p.stock !== 0) return false
      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [products, search, status, dateFrom, dateTo])

  const hasFilters = search || status !== 'all' || dateFrom || dateTo

  const dateLabel =
    dateFrom || dateTo
      ? `${dateFrom ? new Date(dateFrom).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'} → ${dateTo ? new Date(dateTo).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'}`
      : 'Date range'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Products List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here you can find all of your products</p>
        </div>
        <div className="flex items-center gap-2">
          {/* More Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreActions(p => !p)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              More Actions
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
            {showMoreActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMoreActions(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { exportToCSV(filtered); setShowMoreActions(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export CSV
                  </button>
                  <label className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Import CSV
                    <input type="file" accept=".csv" className="hidden" onChange={() => setShowMoreActions(false)} />
                  </label>
                </div>
              </>
            )}
          </div>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Products</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{total.toLocaleString()}</p>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              All time
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Total products in your store</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock Products</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{inStock.toLocaleString()}</p>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              In stock
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Products with available stock</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Out of Stock</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{outOfStock.toLocaleString()}</p>
            <span className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Empty
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Products needing restock</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 mb-4 flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
          />
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />

        {/* Status filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowStatusDropdown(p => !p); setShowDatePicker(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              status !== 'all'
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 9h12M9 13.5h6M11 18h2" />
            </svg>
            {statusLabels[status]}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showStatusDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
              <div className="absolute left-0 top-full mt-1.5 z-20 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
                {(Object.entries(statusLabels) as [StatusFilter, string][]).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => { setStatus(val); setShowStatusDropdown(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${
                      status === val
                        ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {label}
                    {status === val && (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Date range */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowDatePicker(p => !p); setShowStatusDropdown(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
              dateFrom || dateTo
                ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {dateLabel}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg p-4 min-w-60">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Filter by created date</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">From</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">To</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => { setDateFrom(''); setDateTo(''); setShowDatePicker(false) }}
                    className="flex-1 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Result count + clear */}
        {hasFilters && (
          <>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => { setSearch(''); setStatus('all'); setDateFrom(''); setDateTo('') }}
              className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          </>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-600">
            {products.length === 0 ? 'No products yet.' : 'No products match your filters.'}
          </p>
          {products.length === 0 && (
            <Link href="/admin/products/new" className="text-sm text-gray-900 dark:text-white font-medium mt-2 inline-block hover:underline">
              Add your first product →
            </Link>
          )}
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  {/* Product */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white leading-tight">{product.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-0.5">{product.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {product.categories?.name ?? <span className="text-gray-300 dark:text-gray-700">—</span>}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">₦{fmt(product.price)}</p>
                    {product.compare_at_price && (
                      <p className="text-xs text-gray-400 dark:text-gray-600 line-through mt-0.5">₦{fmt(product.compare_at_price)}</p>
                    )}
                  </td>

                  {/* Stock */}
                  <td className="px-4 py-3">
                    <StockBadge stock={product.stock} />
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(product.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                          Featured
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-5 justify-end">
                      <DuplicateButton id={product.id} action={duplicateProduct} />
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        id={product.id}
                        action={deleteProduct}
                        confirm={`Delete "${product.name}"? This can't be undone.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
