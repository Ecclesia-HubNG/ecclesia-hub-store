'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProduct, duplicateProduct, quickUpdateProduct, bulkImportProducts } from '@/lib/actions/products'
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
  category_id: string | null
  brand_id: string | null
  categories: { name: string } | null
}

type Category = { id: string; name: string }
type Brand = { id: string; name: string }
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

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 shadow transform transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      values.push(current); current = ''
    } else {
      current += ch
    }
  }
  values.push(current)
  return values
}

type ImportRow = {
  name: string
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
  is_featured: boolean
  isDuplicate: boolean
}

function parseImportCSV(text: string, existing: Product[]): ImportRow[] {
  const lines = text.trim().split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim())
  const nameIdx = headers.findIndex(h => h === 'name')
  const priceIdx = headers.findIndex(h => h === 'price')
  const compareIdx = headers.findIndex(h => h.includes('compare'))
  const stockIdx = headers.findIndex(h => h === 'stock')
  const statusIdx = headers.findIndex(h => h === 'status')
  const featuredIdx = headers.findIndex(h => h === 'featured')
  if (nameIdx === -1 || priceIdx === -1) return []

  const existingNames = new Set(existing.map(p => p.name.toLowerCase().trim()))
  const existingSlugs = new Set(existing.map(p => p.slug))

  return lines.slice(1).map(line => {
    const vals = parseCSVLine(line)
    const name = vals[nameIdx]?.trim() ?? ''
    const isDuplicate =
      existingNames.has(name.toLowerCase()) ||
      existingSlugs.has(slugify(name))
    return {
      name,
      price: parseFloat(vals[priceIdx] ?? '0') || 0,
      compare_at_price: compareIdx !== -1 && vals[compareIdx] ? parseFloat(vals[compareIdx]) || null : null,
      stock: stockIdx !== -1 ? parseInt(vals[stockIdx] ?? '0') || 0 : 0,
      is_active: statusIdx !== -1 ? vals[statusIdx]?.toLowerCase() === 'active' : true,
      is_featured: featuredIdx !== -1 ? vals[featuredIdx]?.toLowerCase() === 'yes' : false,
      isDuplicate,
    }
  }).filter(r => r.name.length > 0)
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

const inputCls = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5'

export function ProductsManager({
  products,
  categories,
  brands,
}: {
  products: Product[]
  categories: Category[]
  brands: Brand[]
}) {
  const router = useRouter()

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [categoryId, setCategoryId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Dropdown open states
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)

  // Quick edit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [qName, setQName] = useState('')
  const [qPrice, setQPrice] = useState('')
  const [qCompare, setQCompare] = useState('')
  const [qStock, setQStock] = useState('')
  const [qCategoryId, setQCategoryId] = useState('')
  const [qBrandId, setQBrandId] = useState('')
  const [qActive, setQActive] = useState(true)
  const [qFeatured, setQFeatured] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSaving, startSave] = useTransition()

  // CSV import
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null)
  const [isImporting, startImport] = useTransition()
  const [importDone, setImportDone] = useState('')

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const rows = parseImportCSV(text, products)
      setImportRows(rows)
      setImportDone('')
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = () => {
    if (!importRows) return
    const toImport = importRows.filter(r => !r.isDuplicate)
    if (!toImport.length) { setImportRows(null); return }
    startImport(async () => {
      const result = await bulkImportProducts(toImport)
      if ('error' in result) { setImportDone(`Error: ${result.error}`); return }
      setImportDone(`${result.count} product${result.count !== 1 ? 's' : ''} imported successfully.`)
      setImportRows(null)
      router.refresh()
    })
  }

  const openQuickEdit = (p: Product) => {
    setEditingProduct(p)
    setSaveError('')
    setQName(p.name)
    setQPrice(p.price.toString())
    setQCompare(p.compare_at_price?.toString() ?? '')
    setQStock(p.stock.toString())
    setQCategoryId(p.category_id ?? '')
    setQBrandId(p.brand_id ?? '')
    setQActive(p.is_active)
    setQFeatured(p.is_featured)
  }

  const closeQuickEdit = () => setEditingProduct(null)

  const handleSave = () => {
    if (!editingProduct) return
    setSaveError('')
    startSave(async () => {
      const result = await quickUpdateProduct(editingProduct.id, {
        name: qName,
        price: parseFloat(qPrice) || 0,
        compare_at_price: qCompare ? parseFloat(qCompare) : null,
        stock: parseInt(qStock) || 0,
        category_id: qCategoryId || null,
        brand_id: qBrandId || null,
        is_active: qActive,
        is_featured: qFeatured,
      })
      if (result?.error) { setSaveError(result.error); return }
      closeQuickEdit()
      router.refresh()
    })
  }

  // Stats
  const total = products.length
  const inStock = products.filter(p => p.stock > 0).length
  const outOfStock = products.filter(p => p.stock === 0).length

  // Filtered list
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
      if (categoryId && p.category_id !== categoryId) return false
      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [products, search, status, categoryId, dateFrom, dateTo])

  const hasFilters = !!(search || status !== 'all' || categoryId || dateFrom || dateTo)
  const clearFilters = () => { setSearch(''); setStatus('all'); setCategoryId(''); setDateFrom(''); setDateTo('') }

  const selectedCategory = categories.find(c => c.id === categoryId)

  const dateLabel =
    dateFrom || dateTo
      ? `${dateFrom ? new Date(dateFrom).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'} → ${dateTo ? new Date(dateTo).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'}`
      : 'Date range'

  const closeAll = () => { setShowStatusDropdown(false); setShowCategoryDropdown(false); setShowDatePicker(false); setShowMoreActions(false) }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Products List</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here you can find all of your products</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreActions(p => !p)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              More Actions
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
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
                    <input type="file" accept=".csv" className="hidden" onChange={e => { handleImportFile(e); setShowMoreActions(false) }} />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const template = 'Name,Price,Compare At Price,Stock,Status,Featured\n"Example Product",5000,,10,Active,No'
                      const blob = new Blob([template], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'products-import-template.csv'
                      a.click()
                      URL.revokeObjectURL(url)
                      setShowMoreActions(false)
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    CSV Template
                  </button>
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
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />All time
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Total products in your store</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock Products</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{inStock.toLocaleString()}</p>
            <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />In stock
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Products with available stock</p>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Out of Stock</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{outOfStock.toLocaleString()}</p>
            <span className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 mb-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />Empty
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
            onClick={() => { setShowStatusDropdown(p => !p); setShowCategoryDropdown(false); setShowDatePicker(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${status !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
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
                  <button key={val} type="button" onClick={() => { setStatus(val); setShowStatusDropdown(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${status === val ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
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

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowCategoryDropdown(p => !p); setShowStatusDropdown(false); setShowDatePicker(false) }}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${categoryId ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" />
              </svg>
              {selectedCategory?.name ?? 'All Categories'}
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {showCategoryDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden max-h-64 overflow-y-auto">
                  <button type="button" onClick={() => { setCategoryId(''); setShowCategoryDropdown(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${!categoryId ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    All Categories
                    {!categoryId && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                  </button>
                  {categories.map(c => (
                    <button key={c.id} type="button" onClick={() => { setCategoryId(c.id); setShowCategoryDropdown(false) }}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${categoryId === c.id ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      {c.name}
                      {categoryId === c.id && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Date range */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowDatePicker(p => !p); setShowStatusDropdown(false); setShowCategoryDropdown(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${dateFrom || dateTo ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
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
                    <label className={labelCls}>From</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>To</label>
                    <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setShowDatePicker(false) }}
                    className="flex-1 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Clear
                  </button>
                  <button type="button" onClick={() => setShowDatePicker(false)}
                    className="flex-1 px-3 py-1.5 text-xs text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Count + clear */}
        {hasFilters && (
          <>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
            <button type="button" onClick={clearFilters}
              className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline underline-offset-2">
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
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {product.categories?.name ?? <span className="text-gray-300 dark:text-gray-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">₦{fmt(product.price)}</p>
                    {product.compare_at_price && (
                      <p className="text-xs text-gray-400 dark:text-gray-600 line-through mt-0.5">₦{fmt(product.compare_at_price)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StockBadge stock={product.stock} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(product.created_at).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${product.is_active ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${product.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {product.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400">Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4 justify-end">
                      {/* Quick edit */}
                      <button
                        type="button"
                        onClick={() => openQuickEdit(product)}
                        title="Quick edit"
                        className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                        </svg>
                        Quick edit
                      </button>
                      <DuplicateButton id={product.id} action={duplicateProduct} />
                      <Link href={`/admin/products/${product.id}/edit`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        Edit
                      </Link>
                      <DeleteButton id={product.id} action={deleteProduct} confirm={`Delete "${product.name}"? This can't be undone.`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import result toast */}
      {importDone && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl shadow-lg">
          <svg className="w-4 h-4 text-green-400 dark:text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          {importDone}
          <button type="button" onClick={() => setImportDone('')} className="ml-2 opacity-60 hover:opacity-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* CSV Import modal */}
      {importRows !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={() => setImportRows(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Import Products</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{importRows.length} rows found in CSV</p>
                </div>
                <button type="button" onClick={() => setImportRows(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary */}
              <div className="px-6 py-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{importRows.length}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total rows</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950/40 rounded-xl text-center">
                    <p className="text-xl font-bold text-green-700 dark:text-green-400">{importRows.filter(r => !r.isDuplicate).length}</p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">Will import</p>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-center">
                    <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{importRows.filter(r => r.isDuplicate).length}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Duplicates (skip)</p>
                  </div>
                </div>

                {/* Preview list */}
                {importRows.length > 0 && (
                  <div className="max-h-52 overflow-y-auto border border-gray-100 dark:border-gray-800 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                    {importRows.map((r, i) => (
                      <div key={i} className={`flex items-center gap-3 px-3 py-2.5 ${r.isDuplicate ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${r.isDuplicate ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>{r.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">₦{r.price.toLocaleString()} · {r.stock} in stock</p>
                        </div>
                        {r.isDuplicate ? (
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-500 shrink-0">duplicate</span>
                        ) : (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400 shrink-0">new</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {importRows.filter(r => !r.isDuplicate).length === 0 && importRows.length > 0 && (
                  <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-2">
                    All rows already exist — nothing new to import.
                  </p>
                )}

                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Required columns: <span className="font-mono">Name</span>, <span className="font-mono">Price</span>. Optional: <span className="font-mono">Stock</span>, <span className="font-mono">Status</span>, <span className="font-mono">Featured</span>, <span className="font-mono">Compare At Price</span>.
                  {' '}<button type="button" onClick={() => {
                    const t = 'Name,Price,Compare At Price,Stock,Status,Featured\n"Example Product",5000,,10,Active,No'
                    const blob = new Blob([t], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = 'template.csv'; a.click()
                    URL.revokeObjectURL(url)
                  }} className="underline underline-offset-2 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">Download template</button>
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                <button type="button" onClick={() => setImportRows(null)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmImport} disabled={isImporting || importRows.filter(r => !r.isDuplicate).length === 0}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50">
                  {isImporting ? 'Importing…' : `Import ${importRows.filter(r => !r.isDuplicate).length} products`}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick edit drawer */}
      <>
        {/* Backdrop */}
        <div
          onClick={closeQuickEdit}
          className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${editingProduct ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Panel */}
        <div className={`fixed top-0 right-0 z-50 h-full w-[420px] bg-white dark:bg-gray-950 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${editingProduct ? 'translate-x-0' : 'translate-x-full'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Quick Edit</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Changes save immediately</p>
            </div>
            <button
              type="button"
              onClick={closeQuickEdit}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {editingProduct && (
              <>
                {/* Product preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                  {editingProduct.thumbnail ? (
                    <img src={editingProduct.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{editingProduct.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">{editingProduct.slug}</p>
                  </div>
                  <Link
                    href={`/admin/products/${editingProduct.id}/edit`}
                    className="ml-auto shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors whitespace-nowrap"
                  >
                    Full edit →
                  </Link>
                </div>

                {/* Name */}
                <div>
                  <label className={labelCls}>Product name</label>
                  <input type="text" value={qName} onChange={e => setQName(e.target.value)} className={inputCls} />
                </div>

                {/* Price row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Price (₦)</label>
                    <input type="number" min="0" step="0.01" value={qPrice} onChange={e => setQPrice(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Compare at (₦)</label>
                    <input type="number" min="0" step="0.01" value={qCompare} onChange={e => setQCompare(e.target.value)} placeholder="—" className={inputCls} />
                  </div>
                </div>

                {/* Stock */}
                <div>
                  <label className={labelCls}>Stock quantity</label>
                  <input type="number" min="0" step="1" value={qStock} onChange={e => setQStock(e.target.value)} className={inputCls} />
                </div>

                {/* Category */}
                <div>
                  <label className={labelCls}>Category</label>
                  <select value={qCategoryId} onChange={e => setQCategoryId(e.target.value)}
                    className={`${inputCls} appearance-none`}>
                    <option value="">No category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {/* Brand */}
                {brands.length > 0 && (
                  <div>
                    <label className={labelCls}>Brand</label>
                    <select value={qBrandId} onChange={e => setQBrandId(e.target.value)}
                      className={`${inputCls} appearance-none`}>
                      <option value="">No brand</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Toggles */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Active</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Visible to customers</p>
                    </div>
                    <Toggle on={qActive} onChange={() => setQActive(p => !p)} />
                  </div>
                  <div className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Featured</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Highlighted in store</p>
                    </div>
                    <Toggle on={qFeatured} onChange={() => setQFeatured(p => !p)} />
                  </div>
                </div>

                {saveError && (
                  <p className="text-xs text-red-500 dark:text-red-400">{saveError}</p>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={closeQuickEdit}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </>
    </div>
  )
}
