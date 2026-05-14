'use client'

import { useFormState } from 'react-dom'
import { useEffect, useRef, useState, useTransition } from 'react'
import type { DragEvent, ChangeEvent, KeyboardEvent, FormEvent } from 'react'
import Link from 'next/link'
import { createCategoryInline } from '@/lib/actions/categories'

// ─── Types ────────────────────────────────────────────────

type Category = { id: string; name: string }
type RelatedProduct = { id: string; name: string; thumbnail: string | null }

type Product = {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  sale_price: number | null
  sale_starts_at: string | null
  sale_ends_at: string | null
  category_id: string | null
  brand: string | null
  thumbnail: string | null
  images: string[] | null
  video_url: string | null
  stock: number
  sku: string | null
  barcode: string | null
  weight: number | null
  dimensions: { length?: number; width?: number; height?: number } | null
  is_featured: boolean
  is_active: boolean
  tags: string[] | null
  variants: Array<{ name: string; options: Array<{ value: string; price?: number | null }> }> | null
  attributes: Array<{ key: string; value: string }> | null
  shipping_type: string | null
  related_product_ids: string[] | null
  meta_title: string | null
  meta_description: string | null
}

type ActionResult = { error: string } | undefined | null
type ActionFn = (state: ActionResult, formData: FormData) => Promise<ActionResult>

type ImageItem = {
  id: string
  file?: File
  preview: string
  uploading: boolean
  uploaded: boolean
  error?: string
  uploadedUrl?: string
}

type VariantOption = { id: string; value: string; price: string }
type VariantRow = { id: string; name: string; options: VariantOption[] }
type AttributeRow = { id: string; key: string; value: string }

// ─── Helpers ──────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function genId() { return Math.random().toString(36).slice(2) }

// ─── Styles ───────────────────────────────────────────────

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors placeholder:text-gray-400'
const selectCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors'

// ─── Sub-components ───────────────────────────────────────

function SubmitButton({ label, pending }: { label: string; pending: boolean }) {
  return (
    <button type="submit" disabled={pending}
      className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
      {pending ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Saving…
        </span>
      ) : label}
    </button>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  )
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children}
      {optional && <span className="text-gray-400 font-normal ml-1 text-xs">(optional)</span>}
    </label>
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

function PlusIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

// ─── Main Component ───────────────────────────────────────

export default function ProductForm({
  action, product, categories, allProducts = [], submitLabel = 'Publish Product',
}: {
  action: ActionFn
  product?: Product
  categories: Category[]
  allProducts?: RelatedProduct[]
  submitLabel?: string
}) {
  const [state, formAction] = useFormState(action, null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Name / Slug
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!product)

  // Images
  const [images, setImages] = useState<ImageItem[]>(
    (product?.images ?? []).map(url => ({ id: genId(), preview: url, uploading: false, uploaded: true, uploadedUrl: url }))
  )
  const [dragOver, setDragOver] = useState(false)
  const [dragImageIndex, setDragImageIndex] = useState<number | null>(null)

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map(v => ({
      id: genId(), name: v.name,
      options: (v.options ?? []).map(o => ({ id: genId(), value: o.value, price: o.price != null ? String(o.price) : '' })),
    }))
  )

  // Attributes
  const [attributes, setAttributes] = useState<AttributeRow[]>(
    (product?.attributes ?? []).map(a => ({ id: genId(), key: a.key, value: a.value }))
  )

  // Tags
  const [tags, setTags] = useState<string[]>(product?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  // Category
  const [localCategories, setLocalCategories] = useState<Category[]>(categories)
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.category_id ?? '')
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  // Related products
  const [relatedIds, setRelatedIds] = useState<string[]>(product?.related_product_ids ?? [])
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Dimensions
  const [dims, setDims] = useState({
    length: product?.dimensions?.length ? String(product.dimensions.length) : '',
    width:  product?.dimensions?.width  ? String(product.dimensions.width)  : '',
    height: product?.dimensions?.height ? String(product.dimensions.height) : '',
  })

  useEffect(() => { if (!slugEdited) setSlug(slugify(name)) }, [name, slugEdited])

  // ── Image upload ─────────────────────────────────────────

  const uploadImage = async (item: ImageItem) => {
    if (!item.file) return
    const fd = new FormData()
    fd.append('file', item.file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) {
      setImages(prev => prev.map(i => i.id === item.id ? { ...i, uploading: false, error: json.error ?? 'Upload failed' } : i))
      return
    }
    setImages(prev => prev.map(i => i.id === item.id ? { ...i, uploading: false, uploaded: true, uploadedUrl: json.url } : i))
  }

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    const newItems: ImageItem[] = imageFiles.map(file => ({ id: genId(), file, preview: URL.createObjectURL(file), uploading: true, uploaded: false }))
    setImages(prev => [...prev, ...newItems])
    newItems.forEach(uploadImage)
  }

  const removeImage = (id: string) => {
    const img = images.find(i => i.id === id)
    if (img?.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
    setImages(prev => prev.filter(i => i.id !== id))
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  // Image drag-to-reorder
  const handleImageDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragImageIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleImageDropReorder = (e: DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    if (dragImageIndex === null || dragImageIndex === targetIndex) return
    setImages(prev => {
      const next = [...prev]
      const [removed] = next.splice(dragImageIndex, 1)
      next.splice(targetIndex, 0, removed)
      return next
    })
    setDragImageIndex(null)
  }

  // ── Tags ─────────────────────────────────────────────────

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/,/g, '')
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags(prev => prev.slice(0, -1))
  }

  // ── Variants ─────────────────────────────────────────────

  const addVariant = () => setVariants(prev => [...prev, { id: genId(), name: '', options: [{ id: genId(), value: '', price: '' }] }])
  const removeVariant = (id: string) => setVariants(prev => prev.filter(v => v.id !== id))
  const updateVariantName = (id: string, name: string) => setVariants(prev => prev.map(v => v.id === id ? { ...v, name } : v))
  const addOption = (vid: string) => setVariants(prev => prev.map(v => v.id === vid ? { ...v, options: [...v.options, { id: genId(), value: '', price: '' }] } : v))
  const updateOption = (vid: string, oid: string, field: 'value' | 'price', val: string) =>
    setVariants(prev => prev.map(v => v.id === vid ? { ...v, options: v.options.map(o => o.id === oid ? { ...o, [field]: val } : o) } : v))
  const removeOption = (vid: string, oid: string) =>
    setVariants(prev => prev.map(v => v.id === vid ? { ...v, options: v.options.filter(o => o.id !== oid) } : v))

  // ── Attributes ───────────────────────────────────────────

  const addAttribute = () => setAttributes(prev => [...prev, { id: genId(), key: '', value: '' }])
  const updateAttribute = (id: string, field: 'key' | 'value', value: string) =>
    setAttributes(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  const removeAttribute = (id: string) => setAttributes(prev => prev.filter(a => a.id !== id))

  // ── Inline category ───────────────────────────────────────

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) return
    setAddingCategory(true); setCategoryError('')
    const result = await createCategoryInline(trimmed)
    if ('error' in result) {
      setCategoryError(result.error)
    } else {
      setLocalCategories(prev => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedCategoryId(result.id)
      setNewCategoryName(''); setShowNewCategory(false)
    }
    setAddingCategory(false)
  }

  // ── Related products ──────────────────────────────────────

  const filteredProducts = allProducts.filter(p => !relatedIds.includes(p.id) && p.name.toLowerCase().includes(productSearch.toLowerCase()))

  // ── Submit ────────────────────────────────────────────────

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (images.some(i => i.uploading)) return
    const fd = new FormData(formRef.current!)
    fd.set('image_urls', JSON.stringify(images.filter(i => i.uploadedUrl).map(i => i.uploadedUrl!)))
    fd.set('tags', JSON.stringify(tags))
    fd.set('variants', JSON.stringify(variants.filter(v => v.name.trim()).map(v => ({
      name: v.name.trim(),
      options: v.options.filter(o => o.value.trim()).map(o => ({ value: o.value.trim(), price: o.price ? parseFloat(o.price) : null })),
    }))))
    fd.set('attributes', JSON.stringify(attributes.filter(a => a.key.trim()).map(a => ({ key: a.key.trim(), value: a.value.trim() }))))
    fd.set('related_product_ids', JSON.stringify(relatedIds))
    fd.set('dimensions', JSON.stringify({
      length: dims.length ? parseFloat(dims.length) : null,
      width:  dims.width  ? parseFloat(dims.width)  : null,
      height: dims.height ? parseFloat(dims.height) : null,
    }))
    startTransition(() => { formAction(fd) })
  }

  const anyUploading = images.some(i => i.uploading)
  const saving = isPending

  // ── Render ────────────────────────────────────────────────

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {/* Top progress bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-0.5 bg-transparent transition-opacity duration-300 ${saving ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`h-full bg-gray-900 transition-all duration-[2000ms] ease-out ${saving ? 'w-4/5' : 'w-0'}`} />
      </div>

      {state?.error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{state.error}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">

        {/* ── Left column ── */}
        <div className="space-y-5 min-w-0">

          {/* Images */}
          <Card title="Product Images">
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${dragOver ? 'border-gray-400 bg-gray-100' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}
            >
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Drop images here, or <span className="text-gray-900 underline underline-offset-2">browse</span></p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP up to 10 MB · Drag to reorder</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="hidden" />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
                {images.map((img, i) => (
                  <div key={img.id}
                    draggable
                    onDragStart={e => handleImageDragStart(e, i)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleImageDropReorder(e, i)}
                    onDragEnd={() => setDragImageIndex(null)}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border cursor-move transition-opacity ${dragImageIndex === i ? 'opacity-40' : 'border-gray-200'}`}
                  >
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                    {img.error && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                        <span className="text-white text-xs px-1 text-center leading-tight">Failed</span>
                      </div>
                    )}
                    {i === 0 && !img.uploading && !img.error && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded font-medium">Main</span>
                    )}
                    <button type="button" onClick={e => { e.stopPropagation(); removeImage(img.id) }}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-red-600 text-xs font-bold">×</button>
                  </div>
                ))}
              </div>
            )}
            {anyUploading && <p className="text-xs text-gray-400 mt-2">Uploading images…</p>}

            <div className="mt-4">
              <FieldLabel optional>Product Video URL</FieldLabel>
              <input name="video_url" type="url" defaultValue={product?.video_url ?? ''} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">YouTube or Vimeo link shown on the product page.</p>
            </div>
          </Card>

          {/* Product info */}
          <Card title="Product Information">
            <div className="space-y-4">
              <div>
                <FieldLabel>Product Name</FieldLabel>
                <input name="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. NIV Study Bible" className={inputCls} />
              </div>
              <div>
                <FieldLabel optional>URL Slug</FieldLabel>
                <input name="slug" value={slug} onChange={e => { setSlug(e.target.value); setSlugEdited(true) }} placeholder="niv-study-bible" className={`${inputCls} font-mono`} />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from product name.</p>
              </div>
              <div>
                <FieldLabel optional>Short Description</FieldLabel>
                <textarea name="short_description" defaultValue={product?.short_description ?? ''} rows={2} placeholder="One or two sentences…" className={`${inputCls} resize-none`} />
              </div>
              <div>
                <FieldLabel optional>Full Description</FieldLabel>
                <textarea name="description" defaultValue={product?.description ?? ''} rows={6} placeholder="Detailed product description, features, specifications…" className={`${inputCls} resize-none`} />
              </div>
            </div>
          </Card>

          {/* SEO */}
          <Card title="SEO">
            <div className="space-y-4">
              <div>
                <FieldLabel optional>Meta Title</FieldLabel>
                <input name="meta_title" defaultValue={product?.meta_title ?? ''} placeholder={name || 'Product name for search engines'} className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Recommended: 50–60 characters.</p>
              </div>
              <div>
                <FieldLabel optional>Meta Description</FieldLabel>
                <textarea name="meta_description" defaultValue={product?.meta_description ?? ''} rows={3} placeholder="Brief description shown in Google search results…" className={`${inputCls} resize-none`} />
                <p className="text-xs text-gray-400 mt-1">Recommended: 150–160 characters.</p>
              </div>
            </div>
          </Card>

          {/* Related Products */}
          {allProducts.length > 0 && (
            <Card title="Related Products">
              <p className="text-xs text-gray-400 mb-3">Shown as "You may also like" on the product page.</p>
              {relatedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {relatedIds.map(id => {
                    const p = allProducts.find(p => p.id === id)
                    if (!p) return null
                    return (
                      <span key={id} className="flex items-center gap-1.5 pl-2 pr-1 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {p.thumbnail && <img src={p.thumbnail} className="w-4 h-4 rounded-full object-cover" alt="" />}
                        {p.name}
                        <button type="button" onClick={() => setRelatedIds(prev => prev.filter(i => i !== id))}
                          className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700">×</button>
                      </span>
                    )
                  })}
                </div>
              )}
              <div className="relative">
                <input
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowProductDropdown(true) }}
                  onFocus={() => setShowProductDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProductDropdown(false), 150)}
                  placeholder="Search products to link…"
                  className={inputCls}
                />
                {showProductDropdown && filteredProducts.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.slice(0, 8).map(p => (
                      <button key={p.id} type="button"
                        onMouseDown={() => { setRelatedIds(prev => [...prev, p.id]); setProductSearch('') }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors">
                        {p.thumbnail ? <img src={p.thumbnail} className="w-7 h-7 rounded object-cover shrink-0" alt="" /> : <div className="w-7 h-7 rounded bg-gray-100 shrink-0" />}
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Variants */}
          <Card title="Variants">
            <p className="text-xs text-gray-400 mb-3">Each variant (e.g. ML, Size) has individual values with their own price.</p>
            <div className="space-y-3">
              {variants.map(v => (
                <div key={v.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <input value={v.name} onChange={e => updateVariantName(v.id, e.target.value)} placeholder="Variant name (e.g. ML, Size, Color)" className={`${inputCls} font-medium`} />
                    <RemoveBtn onClick={() => removeVariant(v.id)} />
                  </div>
                  <div className="space-y-1.5 pl-3 border-l-2 border-gray-100">
                    <div className="grid grid-cols-[minmax(0,1fr)_130px] gap-2 mb-1">
                      <span className="text-xs text-gray-400 px-1">Value</span>
                      <span className="text-xs text-gray-400 px-1">Price (₦)</span>
                    </div>
                    {v.options.map(o => (
                      <div key={o.id} className="grid grid-cols-[minmax(0,1fr)_130px_28px] gap-2 items-center">
                        <input value={o.value} onChange={e => updateOption(v.id, o.id, 'value', e.target.value)} placeholder="e.g. 100ml" className={inputCls} />
                        <input value={o.price} onChange={e => updateOption(v.id, o.id, 'price', e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} />
                        <RemoveBtn onClick={() => removeOption(v.id, o.id)} />
                      </div>
                    ))}
                    <button type="button" onClick={() => addOption(v.id)} className="mt-1 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                      <PlusIcon className="w-3.5 h-3.5" /> Add value
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addVariant} className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <PlusIcon /> Add variant
            </button>
          </Card>

          {/* Attributes */}
          <Card title="Attributes">
            <p className="text-xs text-gray-400 mb-3">e.g. Material: Leather, Language: English, Weight: 800g</p>
            <div className="space-y-2">
              {attributes.map(a => (
                <div key={a.id} className="grid grid-cols-[160px_minmax(0,1fr)_28px] gap-2 items-center">
                  <input value={a.key} onChange={e => updateAttribute(a.id, 'key', e.target.value)} placeholder="Attribute" className={inputCls} />
                  <input value={a.value} onChange={e => updateAttribute(a.id, 'value', e.target.value)} placeholder="Value" className={inputCls} />
                  <RemoveBtn onClick={() => removeAttribute(a.id)} />
                </div>
              ))}
            </div>
            <button type="button" onClick={addAttribute} className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <PlusIcon /> Add attribute
            </button>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start min-w-0">

          {/* Publish */}
          <Card title="Publish">
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input name="is_active" type="checkbox" defaultChecked={product ? product.is_active : true} className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                <div><p className="text-sm font-medium text-gray-700">Active</p><p className="text-xs text-gray-400">Visible in the store</p></div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input name="is_featured" type="checkbox" defaultChecked={product?.is_featured ?? false} className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                <div><p className="text-sm font-medium text-gray-700">Featured</p><p className="text-xs text-gray-400">Show on homepage</p></div>
              </label>
            </div>
            <SubmitButton label={anyUploading ? 'Uploading images…' : submitLabel} pending={saving || anyUploading} />
            <Link href="/admin/products" className="block text-center mt-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">Cancel</Link>
          </Card>

          {/* Pricing */}
          <Card title="Pricing">
            <div className="space-y-3">
              <div>
                <FieldLabel>Price (₦)</FieldLabel>
                <input name="price" type="number" step="0.01" min="0" defaultValue={product?.price ?? ''} required placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <FieldLabel optional>Compare-at Price (₦)</FieldLabel>
                <input name="compare_at_price" type="number" step="0.01" min="0" defaultValue={product?.compare_at_price ?? ''} placeholder="0.00" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1">Shows as a strikethrough "was" price.</p>
              </div>
              <div className="pt-1 border-t border-gray-100">
                <FieldLabel optional>Sale Price (₦)</FieldLabel>
                <input name="sale_price" type="number" step="0.01" min="0" defaultValue={product?.sale_price ?? ''} placeholder="0.00" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <FieldLabel optional>Sale Starts</FieldLabel>
                  <input name="sale_starts_at" type="date" defaultValue={product?.sale_starts_at?.slice(0, 10) ?? ''} className={inputCls} />
                </div>
                <div>
                  <FieldLabel optional>Sale Ends</FieldLabel>
                  <input name="sale_ends_at" type="date" defaultValue={product?.sale_ends_at?.slice(0, 10) ?? ''} className={inputCls} />
                </div>
              </div>
            </div>
          </Card>

          {/* Organisation */}
          <Card title="Organisation">
            <div className="space-y-3">
              <div>
                <FieldLabel>Category</FieldLabel>
                <select name="category_id" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className={selectCls}>
                  <option value="">No category</option>
                  {localCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {showNewCategory ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-2">
                      <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } if (e.key === 'Escape') setShowNewCategory(false) }}
                        placeholder="Category name" autoFocus className={`${inputCls} flex-1`} />
                      <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()}
                        className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
                        {addingCategory ? '…' : 'Add'}
                      </button>
                      <button type="button" onClick={() => { setShowNewCategory(false); setCategoryError('') }}
                        className="px-3 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">Cancel</button>
                    </div>
                    {categoryError && <p className="text-xs text-red-500">{categoryError}</p>}
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowNewCategory(true)}
                    className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors">
                    <PlusIcon className="w-3.5 h-3.5" /> Add new category
                  </button>
                )}
              </div>
              <div>
                <FieldLabel optional>Brand</FieldLabel>
                <input name="brand" defaultValue={product?.brand ?? ''} placeholder="e.g. Saltair, Crossway" className={inputCls} />
              </div>
            </div>
          </Card>

          {/* Tags */}
          <Card title="Tags">
            <div className="flex flex-wrap gap-1.5 p-3 border border-gray-200 rounded-lg min-h-[44px] cursor-text"
              onClick={() => document.getElementById('tag-input')?.focus()}>
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  {tag}
                  <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))} className="text-gray-400 hover:text-gray-700">×</button>
                </span>
              ))}
              <input id="tag-input" value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown} onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length === 0 ? 'Type and press Enter…' : ''}
                className="flex-1 min-w-[80px] text-sm outline-none bg-transparent placeholder:text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Press Enter or comma to add a tag.</p>
          </Card>

          {/* Inventory */}
          <Card title="Inventory">
            <div className="space-y-3">
              <div>
                <FieldLabel>Stock Quantity</FieldLabel>
                <input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel optional>SKU</FieldLabel>
                  <input name="sku" defaultValue={product?.sku ?? ''} placeholder="e.g. SLT-100ML" className={inputCls} />
                </div>
                <div>
                  <FieldLabel optional>Barcode</FieldLabel>
                  <input name="barcode" defaultValue={product?.barcode ?? ''} placeholder="ISBN / UPC" className={inputCls} />
                </div>
              </div>
            </div>
          </Card>

          {/* Shipping */}
          <Card title="Shipping">
            <div className="space-y-3">
              <div>
                <FieldLabel>Shipping Type</FieldLabel>
                <select name="shipping_type" defaultValue={product?.shipping_type ?? 'standard'} className={selectCls}>
                  <option value="standard">Standard Delivery</option>
                  <option value="express">Express Delivery</option>
                  <option value="free">Free Shipping</option>
                  <option value="pickup">Store Pickup</option>
                  <option value="digital">Digital / Download</option>
                </select>
              </div>
              <div>
                <FieldLabel optional>Weight (kg)</FieldLabel>
                <input name="weight" type="number" step="0.01" min="0" defaultValue={product?.weight ?? ''} placeholder="0.00" className={inputCls} />
              </div>
              <div>
                <FieldLabel optional>Dimensions (cm)</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  <input value={dims.length} onChange={e => setDims(d => ({ ...d, length: e.target.value }))} type="number" min="0" step="0.1" placeholder="L" className={inputCls} />
                  <input value={dims.width}  onChange={e => setDims(d => ({ ...d, width:  e.target.value }))} type="number" min="0" step="0.1" placeholder="W" className={inputCls} />
                  <input value={dims.height} onChange={e => setDims(d => ({ ...d, height: e.target.value }))} type="number" min="0" step="0.1" placeholder="H" className={inputCls} />
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Bottom save */}
      <div className="flex items-center gap-3 pt-5 mt-1 border-t border-gray-200">
        <SubmitButton label={anyUploading ? 'Uploading images…' : submitLabel} pending={saving || anyUploading} />
        <Link href="/admin/products" className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">Cancel</Link>
      </div>
    </form>
  )
}
