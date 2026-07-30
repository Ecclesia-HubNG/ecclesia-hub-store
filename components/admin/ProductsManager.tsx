'use client'

import { useState, useMemo, useTransition, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { deleteProduct, duplicateProduct, quickUpdateProduct, bulkImportProducts, bulkDeleteProducts, toggleProductActive } from '@/lib/actions/products'
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
  category_ids?: string[] | null
  brand_id: string | null
  sku: string | null
  variants: Array<{ name: string; options: Array<{ value: string; price?: number | null }> }> | null
  images: string[] | null
  description: string | null
  meta_title: string | null
  meta_description: string | null
  categories: { name: string } | null
  brands: { name: string } | null
}

type Category = { id: string; name: string; parent_id?: string | null }
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

function ActiveToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [optimistic, setOptimistic] = useState(isActive)
  const [, startTransition] = useTransition()
  const handleToggle = () => {
    const next = !optimistic
    setOptimistic(next)
    startTransition(async () => {
      const res = await toggleProductActive(id, next)
      if (res?.error) setOptimistic(optimistic)
    })
  }
  return (
    <button
      type="button"
      onClick={handleToggle}
      title={optimistic ? 'Active — click to deactivate' : 'Inactive — click to activate'}
      className="flex items-center gap-1.5 group"
    >
      <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${optimistic ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform duration-200 ${optimistic ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      <span className={`text-xs font-medium transition-colors ${optimistic ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
        {optimistic ? 'Active' : 'Inactive'}
      </span>
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
  id?: string | null
  name: string
  price: number
  compare_at_price: number | null
  stock: number
  is_active: boolean
  is_featured: boolean
  isDuplicate: boolean
  description?: string | null
  short_description?: string | null
  thumbnail?: string | null
  images?: string[]
  sku?: string | null
  barcode?: string | null
  weight?: number | null
  meta_title?: string | null
  meta_description?: string | null
  variants?: Array<{ name: string; values: string[] }>
  category_names?: string[]
  brand_name?: string | null
}

const TEMPLATE_COLUMNS = [
  'ID', 'Name', 'SKU', 'Brand', 'Category',
  'Price', 'Compare At Price', 'Stock', 'Status', 'Featured',
  'Short Description', 'Long Description', 'Thumbnail URL', 'Image URLs',
  'Variant Groups', 'Variant Values',
  'Meta Title', 'Meta Description',
] as const

const TEMPLATE_CSV = [
  '# Ecclesia Hub — Product Import Template',
  '# Delete all rows starting with # before uploading.',
  '# REQUIRED: Name, Price, Stock, Status, Featured',
  '# STATUS: Active or Inactive  |  FEATURED: Yes or No',
  '# IMAGE URLs: pipe-separated  e.g. https://.../1.jpg|https://.../2.jpg',
  '# VARIANT GROUPS: pipe-separated group names  e.g. Color|Size',
  '# VARIANT VALUES: pipe-separated values per group  e.g. Red,Blue|S,M,L',
  '# BRAND: must match an existing brand name exactly (case-insensitive)',
  '#',
  TEMPLATE_COLUMNS.join(','),
  ',"Moisturising Body Lotion",,"Coco Nu Lab","Skincare",5500,7000,50,Active,Yes,"Deeply hydrating lotion","Rich formula with shea butter and vitamin E for all-day moisture.",https://example.com/thumb.jpg,https://example.com/img1.jpg|https://example.com/img2.jpg,Size|Scent,"100ml,200ml|Unscented,Rose","Moisturising Body Lotion | Coco Nu Lab","Shop our best-selling body lotion."',
  ',"Vitamin C Serum",,,"Skincare",8500,,30,Active,No,"Brightening serum","","","","","","",""',
].join('\n')

function parseTemplateCSV(text: string, existing: Product[]): ImportRow[] {
  const cleaned = text.replace(/^﻿/, '').replace(/^ï»¿/, '')
  const lines = cleaned.trim().split('\n').filter(l => !l.trimStart().startsWith('#') && l.trim())
  if (lines.length < 2) return []

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const col = (name: string) => headers.findIndex(h => h === name.toLowerCase())

  const idIdx          = col('id')
  const nameIdx        = col('name')
  const priceIdx       = col('price')
  const compareIdx     = col('compare at price')
  const stockIdx       = col('stock')
  const statusIdx      = col('status')
  const featuredIdx    = col('featured')
  const skuIdx         = col('sku')
  const brandIdx       = col('brand')
  const categoryIdx    = col('category')
  const shortDescIdx   = col('short description')
  const longDescIdx    = col('long description')
  const thumbIdx       = col('thumbnail url')
  const imagesIdx      = col('image urls')
  const varGroupsIdx   = col('variant groups')
  const varValuesIdx   = col('variant values')
  const metaTitleIdx   = col('meta title')
  const metaDescIdx    = col('meta description')

  if (nameIdx === -1 || priceIdx === -1) return []

  const existingNames = new Set(existing.map(p => p.name.toLowerCase().trim()))
  const existingSlugs = new Set(existing.map(p => p.slug))

  return lines.slice(1).flatMap(line => {
    const vals = parseCSVLine(line)
    const name = vals[nameIdx]?.trim() ?? ''
    if (!name) return []

    const rawPrice = vals[priceIdx]?.trim() ?? ''
    const price = parseFloat(rawPrice)
    if (isNaN(price) || rawPrice === '') return []

    const id            = idIdx !== -1 ? vals[idIdx]?.trim() || null : null
    const stock         = stockIdx !== -1 ? parseInt(vals[stockIdx] ?? '') || 0 : 0
    const is_active     = statusIdx !== -1 ? vals[statusIdx]?.trim().toLowerCase() === 'active' : true
    const is_featured   = featuredIdx !== -1 ? vals[featuredIdx]?.trim().toLowerCase() === 'yes' : false
    const compare_at_price = compareIdx !== -1 && vals[compareIdx]?.trim()
      ? parseFloat(vals[compareIdx]) || null : null
    // Rows with an ID are explicit updates — never flag as duplicate
    const isDuplicate   = !id && (existingNames.has(name.toLowerCase()) || existingSlugs.has(slugify(name)))

    const thumbnail  = thumbIdx !== -1 ? vals[thumbIdx]?.trim() || null : null
    const imagesRaw  = imagesIdx !== -1 ? vals[imagesIdx]?.trim() : ''
    const extraImages = imagesRaw ? imagesRaw.split('|').map(s => s.trim()).filter(Boolean) : []
    const images = [thumbnail, ...extraImages].filter((s): s is string => !!s)

    const category = categoryIdx !== -1 ? vals[categoryIdx]?.trim() || null : null
    const brand    = brandIdx !== -1 ? vals[brandIdx]?.trim() || null : null

    // Variants: Groups = "Color|Size", Values = "Red,Blue|S,M,L"
    const groupsRaw  = varGroupsIdx !== -1 ? vals[varGroupsIdx]?.trim() : ''
    const valuesRaw  = varValuesIdx !== -1 ? vals[varValuesIdx]?.trim() : ''
    let variants: Array<{ name: string; values: string[] }> | undefined
    if (groupsRaw) {
      const groupNames  = groupsRaw.split('|').map(s => s.trim()).filter(Boolean)
      const groupValues = valuesRaw ? valuesRaw.split('|').map(s => s.trim()) : []
      variants = groupNames
        .map((gName, i) => ({
          name: gName,
          values: groupValues[i] ? groupValues[i].split(',').map(v => v.trim()).filter(Boolean) : [],
        }))
        .filter(g => g.values.length > 0)
    }

    return [{
      id,
      name,
      price,
      compare_at_price,
      stock,
      is_active,
      is_featured,
      isDuplicate,
      sku:              skuIdx !== -1 ? vals[skuIdx]?.trim() || null : null,
      description:      longDescIdx !== -1 ? vals[longDescIdx]?.trim() || null : null,
      short_description: shortDescIdx !== -1 ? vals[shortDescIdx]?.trim() || null : null,
      thumbnail,
      images:           images.length > 0 ? images : undefined,
      meta_title:       metaTitleIdx !== -1 ? vals[metaTitleIdx]?.trim() || null : null,
      meta_description: metaDescIdx !== -1 ? vals[metaDescIdx]?.trim() || null : null,
      variants:         variants?.length ? variants : undefined,
      category_names:   category ? [category] : undefined,
      brand_name:       brand || undefined,
    }]
  })
}



function esc(v: string | null | undefined) {
  if (!v) return ''
  return `"${String(v).replace(/"/g, '""')}"`
}

function exportToCSV(products: Product[]) {
  const headers = [
    'ID', 'Name', 'SKU', 'Brand', 'Category',
    'Price', 'Compare At Price', 'Stock', 'Status', 'Featured',
    'Short Description', 'Long Description', 'Thumbnail URL', 'Image URLs',
    'Variant Groups', 'Variant Values',
    'Meta Title', 'Meta Description',
  ]

  const rows = products.map(p => {
    const variantGroups = (p.variants ?? []).map(g => g.name).join('|')
    const variantValues = (p.variants ?? []).map(g => g.options.map(o => o.value).join(',')).join('|')
    const imageUrls = (p.images ?? []).filter(Boolean).join('|')

    return [
      esc(p.id),
      esc(p.name),
      esc(p.sku),
      esc(p.brands?.name),
      esc(p.categories?.name),
      p.price,
      p.compare_at_price ?? '',
      p.stock,
      p.is_active ? 'Active' : 'Inactive',
      p.is_featured ? 'Yes' : 'No',
      esc(null),                   // short description — not in list view, blank
      esc(p.description),
      esc(p.thumbnail),
      esc(imageUrls),
      esc(variantGroups),
      esc(variantValues),
      esc(p.meta_title),
      esc(p.meta_description),
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `products-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const inputCls = 'w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white placeholder-gray-400'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5'


export function ProductsManager({
  products,
  categories,
  brands,
  initialPage = 1,
}: {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  initialPage?: number
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
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showStockDropdown, setShowStockDropdown] = useState(false)

  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_high' | 'price_low' | 'stock_high' | 'stock_low'>('newest')
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')

  // Quick edit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [overrides, setOverrides] = useState<Record<string, Product>>({})
  const [qName, setQName] = useState('')
  const [qPrice, setQPrice] = useState('')
  const [qCompare, setQCompare] = useState('')
  const [qStock, setQStock] = useState('')
  const [qCategoryIds, setQCategoryIds] = useState<string[]>([])
  const [qBrandId, setQBrandId] = useState('')
  const [qActive, setQActive] = useState(true)
  const [qFeatured, setQFeatured] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSaving, startSave] = useTransition()

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isBulkDeleting, startBulkDelete] = useTransition()
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false)

  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  // Row actions dropdown
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; right: number } | null>(null)

  // Pagination
  const PAGE_SIZE = 50
  const [currentPage, setCurrentPage] = useState(initialPage)
  const isFirstRender = useRef(true)

  function goToPage(p: number) {
    setCurrentPage(p)
    router.replace(`/admin/products?page=${p}`, { scroll: false })
  }

  // CSV import
  const [showImportPicker, setShowImportPicker] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
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
      const rows = parseTemplateCSV(text, mergedProducts)
      setImportRows(rows)
      setImportDone('')
      setShowImportPicker(false)
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleConfirmImport = () => {
    if (!importRows) return
    const toImport = importRows.filter(r => !r.isDuplicate).map(r => ({
      id: r.id,
      name: r.name,
      price: r.price,
      compare_at_price: r.compare_at_price ?? null,
      stock: r.stock,
      is_active: r.is_active,
      is_featured: r.is_featured,
      description: r.description,
      short_description: r.short_description,
      thumbnail: r.thumbnail,
      images: r.images,
      sku: r.sku,
      barcode: r.barcode,
      weight: r.weight,
      meta_title: r.meta_title,
      meta_description: r.meta_description,
      variants: r.variants,
      category_names: r.category_names,
      brand_name: r.brand_name,
    }))
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
    const validCategoryIds = new Set(categories.map(c => c.id))
    const rawCategoryIds = p.category_ids?.length ? p.category_ids : p.category_id ? [p.category_id] : []
    setQCategoryIds(rawCategoryIds.filter(id => validCategoryIds.has(id)))
    setQBrandId(p.brand_id ?? '')
    setQActive(p.is_active)
    setQFeatured(p.is_featured)
  }

  const closeQuickEdit = () => setEditingProduct(null)

  const toggleQCategory = (id: string) => setQCategoryIds(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const handleSave = () => {
    if (!editingProduct) return
    setSaveError('')
    const updates = {
      name: qName,
      price: parseFloat(qPrice) || 0,
      compare_at_price: qCompare ? parseFloat(qCompare) : null,
      stock: parseInt(qStock) || 0,
      category_id: qCategoryIds[0] ?? null,
      category_ids: qCategoryIds,
      brand_id: qBrandId || null,
      is_active: qActive,
      is_featured: qFeatured,
    }
    startSave(async () => {
      const result = await quickUpdateProduct(editingProduct.id, updates)
      if (result?.error) { setSaveError(result.error); return }
      setOverrides(prev => ({ ...prev, [editingProduct.id]: { ...editingProduct, ...updates } }))
      closeQuickEdit()
      router.refresh()
    })
  }

  // Merge server products with any local optimistic overrides
  const mergedProducts = useMemo(
    () => products.map(p => overrides[p.id] ?? p),
    [products, overrides]
  )

  // Stats
  const total = mergedProducts.length
  const inStock = mergedProducts.filter(p => p.stock > 0).length
  const outOfStock = mergedProducts.filter(p => p.stock === 0).length

  // Filtered list
  const filtered = useMemo(() => {
    return mergedProducts.filter(p => {
      if (search) {
        const q = search.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.slug.includes(q)) return false
      }
      if (status === 'active' && !p.is_active) return false
      if (status === 'inactive' && p.is_active) return false
      if (status === 'featured' && !p.is_featured) return false
      if (status === 'out_of_stock' && p.stock !== 0) return false
      if (stockFilter === 'in_stock' && p.stock === 0) return false
      if (stockFilter === 'low_stock' && (p.stock === 0 || p.stock > 5)) return false
      if (stockFilter === 'out_of_stock' && p.stock !== 0) return false
      if (categoryId && p.category_id !== categoryId) return false
      if (dateFrom && new Date(p.created_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(p.created_at) > new Date(dateTo + 'T23:59:59')) return false
      return true
    })
  }, [mergedProducts, search, status, stockFilter, categoryId, dateFrom, dateTo])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name_asc': return a.name.localeCompare(b.name)
        case 'name_desc': return b.name.localeCompare(a.name)
        case 'price_high': return b.price - a.price
        case 'price_low': return a.price - b.price
        case 'stock_high': return b.stock - a.stock
        case 'stock_low': return a.stock - b.stock
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })
  }, [filtered, sortBy])


  // Reset to page 1 whenever filters/sort change (skip the first render so restored page survives)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setCurrentPage(1)
  }, [search, status, stockFilter, categoryId, dateFrom, dateTo, sortBy])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = useMemo(
    () => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [sorted, currentPage, PAGE_SIZE]
  )

  const hasFilters = !!(search || status !== 'all' || stockFilter !== 'all' || categoryId || dateFrom || dateTo)
  const clearFilters = () => { setSearch(''); setStatus('all'); setStockFilter('all'); setCategoryId(''); setDateFrom(''); setDateTo('') }

  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id))
  const someSelected = selected.size > 0

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(p => next.delete(p.id)); return next })
    } else {
      setSelected(prev => { const next = new Set(prev); filtered.forEach(p => next.add(p.id)); return next })
    }
  }

  const handleBulkDelete = () => {
    const ids = Array.from(selected)
    startBulkDelete(async () => {
      await bulkDeleteProducts(ids)
      setSelected(new Set())
      setBulkDeleteConfirm(false)
      router.refresh()
    })
  }

  const selectedCategory = categories.find(c => c.id === categoryId)

  const dateLabel =
    dateFrom || dateTo
      ? `${dateFrom ? new Date(dateFrom).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'} → ${dateTo ? new Date(dateTo).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' }) : '...'}`
      : 'Date range'

  const closeAll = () => { setShowStatusDropdown(false); setShowCategoryDropdown(false); setShowDatePicker(false); setShowMoreActions(false); setShowSortDropdown(false); setShowStockDropdown(false) }

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
                    onClick={() => { setShowExportModal(true); setShowMoreActions(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    Export CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowImportPicker(true); setShowMoreActions(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                    </svg>
                    Import CSV
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
        <div className="relative w-72 shrink-0">
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

        {/* Stock filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => { setShowStockDropdown(p => !p); setShowStatusDropdown(false); setShowCategoryDropdown(false); setShowDatePicker(false); setShowSortDropdown(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${stockFilter !== 'all' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            {stockFilter === 'all' ? 'All Stock' : stockFilter === 'in_stock' ? 'In Stock' : stockFilter === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showStockDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStockDropdown(false)} />
              <div className="absolute left-0 top-full mt-1.5 z-20 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
                {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map(val => {
                  const label = val === 'all' ? 'All Stock' : val === 'in_stock' ? 'In Stock' : val === 'low_stock' ? 'Low Stock (≤5)' : 'Out of Stock'
                  return (
                    <button key={val} type="button" onClick={() => { setStockFilter(val); setShowStockDropdown(false) }}
                      className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${stockFilter === val ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      {label}
                      {stockFilter === val && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>

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

        {/* Sort by */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => { setShowSortDropdown(p => !p); setShowStatusDropdown(false); setShowCategoryDropdown(false); setShowDatePicker(false); setShowStockDropdown(false) }}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${sortBy !== 'newest' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            Sort
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {showSortDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
              <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden">
                {([
                  ['newest', 'Newest first'],
                  ['oldest', 'Oldest first'],
                  ['name_asc', 'Name A → Z'],
                  ['name_desc', 'Name Z → A'],
                  ['price_high', 'Price: high → low'],
                  ['price_low', 'Price: low → high'],
                  ['stock_high', 'Stock: high → low'],
                  ['stock_low', 'Stock: low → high'],
                ] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => { setSortBy(val); setShowSortDropdown(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm transition-colors ${sortBy === val ? 'text-gray-900 dark:text-white font-medium bg-gray-50 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    {label}
                    {sortBy === val && (
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
            {mergedProducts.length === 0 ? 'No products yet.' : 'No products match your filters.'}
          </p>
          {mergedProducts.length === 0 && (
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
                <th className="pl-4 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white accent-gray-900 dark:accent-white cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {paged.map(product => (
                <tr key={product.id} className={`transition-colors ${selected.has(product.id) ? 'bg-blue-50/60 dark:bg-blue-950/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'}`}>
                  <td className="pl-4 pr-2 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 accent-gray-900 dark:accent-white cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/products/${product.id}/edit?from_page=${currentPage}`}
                      className="flex items-center gap-3 group/row"
                    >
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
                        <p className="font-medium text-gray-900 dark:text-white leading-tight group-hover/row:text-[#4A0F1C] dark:group-hover/row:text-[#D4849A] transition-colors">{product.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono mt-0.5">{product.slug}</p>
                      </div>
                    </Link>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ActiveToggle id={product.id} isActive={product.is_active} />
                      {product.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400">Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Quick edit */}
                      <button
                        type="button"
                        onClick={() => openQuickEdit(product)}
                        title="Quick edit"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                        </svg>
                      </button>

                      {/* Dots menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={e => {
                            if (openActionId === product.id) {
                              setOpenActionId(null)
                              setActionMenuPos(null)
                            } else {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                              setOpenActionId(product.id)
                              setActionMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/80">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce<(number | '…')[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((item, i) =>
                    item === '…' ? (
                      <span key={`e${i}`} className="w-7 text-center text-xs text-gray-400 dark:text-gray-600">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToPage(item as number)}
                        className={`w-8 h-8 text-xs font-medium rounded-lg transition-colors ${
                          item === currentPage
                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                <button
                  type="button"
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import result toast */}
      {/* Bulk action bar */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${someSelected ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-2xl">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="w-px h-4 bg-white/20 dark:bg-gray-900/20" />
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-white/70 dark:text-gray-900/70 hover:text-white dark:hover:text-gray-900 transition-colors"
          >
            Clear
          </button>
          {bulkDeleteConfirm ? (
            <>
              <span className="text-sm text-red-300 dark:text-red-600">Delete {selected.size} product{selected.size !== 1 ? 's' : ''}?</span>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium bg-white/10 dark:bg-gray-900/10 hover:bg-white/20 dark:hover:bg-gray-900/20 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Delete selected
            </button>
          )}
        </div>
      </div>

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

      {/* Export modal */}
      {showExportModal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowExportModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Export Products</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Choose which products to export as CSV</p>
                </div>
                <button type="button" onClick={() => setShowExportModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => { exportToCSV(products); setShowExportModal(false) }}
                  className="flex items-center gap-4 w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">All Products</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{products.length} products total</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { exportToCSV(products.filter(p => p.stock === 0)); setShowExportModal(false) }}
                  className="flex items-center gap-4 w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Out of Stock</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{products.filter(p => p.stock === 0).length} products with 0 stock</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import picker modal */}
      {showImportPicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowImportPicker(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Import Products</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Upload a CSV in the Ecclesia Hub format</p>
                </div>
                <button type="button" onClick={() => setShowImportPicker(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use the Ecclesia Hub CSV format — same columns as the export. Rows with an ID update existing products; rows without an ID create new ones.
                </p>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 underline underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download template
                </button>
                <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  Choose CSV file
                  <input type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSV Import modal */}
      {importRows !== null && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]" onClick={() => !isImporting && setImportRows(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">Review Import</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{importRows.length} rows parsed from CSV</p>
                </div>
                <button type="button" onClick={() => !isImporting && setImportRows(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary chips */}
              <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {importRows.length} total
                </span>
                {importRows.filter(r => !r.isDuplicate && !r.id).length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400">
                    {importRows.filter(r => !r.isDuplicate && !r.id).length} new
                  </span>
                )}
                {importRows.filter(r => !!r.id).length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                    {importRows.filter(r => !!r.id).length} updates
                  </span>
                )}
                {importRows.filter(r => r.isDuplicate).length > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                    {importRows.filter(r => r.isDuplicate).length} duplicates (will skip)
                  </span>
                )}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto min-h-0">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/80 backdrop-blur">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Product</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Brand / Category</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Price</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Stock</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Variants</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Status</th>
                      <th className="text-center px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {importRows.filter(r => !r.isDuplicate).map((r, i) => (
                      <tr key={i} className={r.id ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {r.thumbnail ? (
                              <img src={r.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                                <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                                </svg>
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{r.name}</p>
                              {r.sku && <p className="text-xs text-gray-400 dark:text-gray-600">SKU: {r.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {r.brand_name && <p className="font-medium text-gray-700 dark:text-gray-300">{r.brand_name}</p>}
                          {r.category_names?.[0] && <p>{r.category_names[0]}</p>}
                          {!r.brand_name && !r.category_names?.[0] && <span className="text-gray-300 dark:text-gray-700">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap tabular-nums">
                          ₦{r.price.toLocaleString()}
                          {r.compare_at_price && (
                            <p className="text-xs text-gray-400 line-through">₦{r.compare_at_price.toLocaleString()}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`text-sm font-semibold ${r.stock === 0 ? 'text-red-500' : r.stock <= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {r.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                          {r.variants?.length ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              {r.variants.length} group{r.variants.length !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-700">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${r.is_active ? 'bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                            {r.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {r.id ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">UPDATE</span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-400">NEW</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Duplicates section */}
                {importRows.filter(r => r.isDuplicate).length > 0 && (
                  <div className="border-t-2 border-dashed border-amber-200 dark:border-amber-900/50 mt-2">
                    <div className="px-4 py-3 bg-amber-50/50 dark:bg-amber-950/10">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-2">
                        Duplicates — will be skipped ({importRows.filter(r => r.isDuplicate).length})
                      </p>
                      <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
                        {importRows.filter(r => r.isDuplicate).map((r, i) => (
                          <div key={i} className="flex items-center gap-3 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-amber-700 dark:text-amber-400 font-medium truncate">{r.name}</p>
                              <p className="text-xs text-amber-500/70 dark:text-amber-600">
                                ₦{r.price.toLocaleString()} · {r.stock} in stock — name already exists, no ID provided
                              </p>
                            </div>
                            <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-500">SKIP</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {importRows.filter(r => !r.isDuplicate).length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-gray-400 dark:text-gray-600 text-sm">All rows are duplicates — nothing to import.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4 shrink-0 bg-white dark:bg-gray-900">
                <p className="text-xs text-gray-400 dark:text-gray-600 max-w-xs">
                  Rows with an ID update existing products. Rows without an ID create new ones.
                </p>
                <div className="flex gap-3 shrink-0">
                  <button type="button" onClick={() => setImportRows(null)} disabled={isImporting}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                    Cancel
                  </button>
                  <button type="button" onClick={handleConfirmImport} disabled={isImporting || importRows.filter(r => !r.isDuplicate).length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors min-w-[140px] justify-center">
                    {isImporting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Importing…
                      </>
                    ) : (() => {
                      const newCount = importRows.filter(r => !r.isDuplicate && !r.id).length
                      const updateCount = importRows.filter(r => !!r.id).length
                      if (newCount && updateCount) return `Import ${newCount} · Update ${updateCount}`
                      if (updateCount) return `Update ${updateCount} product${updateCount !== 1 ? 's' : ''}`
                      return `Import ${newCount} product${newCount !== 1 ? 's' : ''}`
                    })()}
                  </button>
                </div>
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
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{editingProduct.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5 truncate">{editingProduct.slug}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">₦{fmt(editingProduct.price)}</p>
                    {editingProduct.compare_at_price && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-through">₦{fmt(editingProduct.compare_at_price)}</p>
                    )}
                  </div>
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

                {/* Categories */}
                <div>
                  <label className={labelCls}>
                    Categories
                    {qCategoryIds.length > 0 && (
                      <span className="ml-1.5 text-xs font-normal text-gray-400">({qCategoryIds.length} selected)</span>
                    )}
                  </label>
                  {categories.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-2 space-y-0.5">
                      {categories.filter(c => !c.parent_id).map(parent => {
                        const subs = categories.filter(c => c.parent_id === parent.id)
                        return (
                          <div key={parent.id}>
                            <label className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={qCategoryIds.includes(parent.id)}
                                onChange={() => toggleQCategory(parent.id)}
                                className="w-3.5 h-3.5 rounded border-gray-300 accent-[#4A0F1C] cursor-pointer"
                              />
                              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{parent.name}</span>
                            </label>
                            {subs.map(sub => (
                              <label key={sub.id} className="flex items-center gap-2.5 pl-7 pr-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={qCategoryIds.includes(sub.id)}
                                  onChange={() => toggleQCategory(sub.id)}
                                  className="w-3.5 h-3.5 rounded border-gray-300 accent-[#4A0F1C] cursor-pointer"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">{sub.name}</span>
                              </label>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-2">No categories yet.</p>
                  )}
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
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-3 shrink-0">
            <div className="flex gap-3">
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
            {editingProduct && (
              <Link
                href={`/admin/products/${editingProduct.id}/edit?from_page=${currentPage}`}
                className="text-xs text-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Open full editor →
              </Link>
            )}
          </div>
        </div>
      </>

      {/* Row action dropdown — rendered in a portal to escape overflow:hidden on the table wrapper */}
      {openActionId && actionMenuPos && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => { setOpenActionId(null); setActionMenuPos(null) }} />
          <div
            className="fixed z-[100] w-36 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 overflow-hidden"
            style={{ top: actionMenuPos.top, right: actionMenuPos.right }}
          >
            <Link
              href={`/admin/products/${openActionId}/edit?from_page=${currentPage}`}
              onClick={() => { setOpenActionId(null); setActionMenuPos(null) }}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
              </svg>
              Edit
            </Link>
            <DuplicateButton
              id={openActionId}
              action={duplicateProduct}
              label="Duplicate"
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left"
            />
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            <DeleteButton
              id={openActionId}
              action={deleteProduct}
              confirm={`Delete this product? This can't be undone.`}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left"
            />
          </div>
        </>,
        document.body
      )}
    </div>
  )
}
