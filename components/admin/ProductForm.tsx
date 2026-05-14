'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useRef, useState, startTransition } from 'react'
import type { DragEvent, ChangeEvent, KeyboardEvent, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────

type Category = { id: string; name: string }

type Product = {
  id: string
  name: string
  slug: string
  short_description: string | null
  description: string | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  thumbnail: string | null
  images: string[] | null
  stock: number
  is_featured: boolean
  is_active: boolean
  tags: string[] | null
  variants: Array<{ name: string; values: string[] }> | null
  attributes: Array<{ key: string; value: string }> | null
  shipping_type: string | null
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

type VariantRow = { id: string; name: string; values: string }
type AttributeRow = { id: string; key: string; value: string }

// ─── Helpers ──────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function genId() {
  return Math.random().toString(36).slice(2)
}

// ─── Style constants ──────────────────────────────────────

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors placeholder:text-gray-400'

const selectCls =
  'w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-colors'

// ─── Sub-components ───────────────────────────────────────

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving…' : label}
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
    <button
      type="button"
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────

export default function ProductForm({
  action,
  product,
  categories,
  submitLabel = 'Publish Product',
}: {
  action: ActionFn
  product?: Product
  categories: Category[]
  submitLabel?: string
}) {
  const [state, formAction] = useFormState(action, null)
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Name / Slug
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!product)

  // Images
  const [images, setImages] = useState<ImageItem[]>(
    (product?.images ?? []).map((url) => ({
      id: genId(),
      preview: url,
      uploading: false,
      uploaded: true,
      uploadedUrl: url,
    }))
  )
  const [dragOver, setDragOver] = useState(false)

  // Variants
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({
      id: genId(),
      name: v.name,
      values: v.values.join(', '),
    }))
  )

  // Attributes
  const [attributes, setAttributes] = useState<AttributeRow[]>(
    (product?.attributes ?? []).map((a) => ({ id: genId(), key: a.key, value: a.value }))
  )

  // Tags
  const [tags, setTags] = useState<string[]>(product?.tags ?? [])
  const [tagInput, setTagInput] = useState('')

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name))
  }, [name, slugEdited])

  // ── Image upload ────────────────────────────────────────

  const uploadImage = async (item: ImageItem) => {
    if (!item.file) return
    const supabase = createClient()
    const ext = item.file.name.split('.').pop() ?? 'jpg'
    const path = `products/${Date.now()}-${genId()}.${ext}`

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(path, item.file)

    if (error) {
      setImages((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, uploading: false, error: error.message } : i))
      )
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path)

    setImages((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, uploading: false, uploaded: true, uploadedUrl: publicUrl, preview: publicUrl }
          : i
      )
    )
  }

  const addFiles = (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    const newItems: ImageItem[] = imageFiles.map((file) => ({
      id: genId(),
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      uploaded: false,
    }))
    setImages((prev) => [...prev, ...newItems])
    newItems.forEach(uploadImage)
  }

  const removeImage = (id: string) => {
    const img = images.find((i) => i.id === id)
    if (img?.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
    setImages((prev) => prev.filter((i) => i.id !== id))
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  // ── Tags ────────────────────────────────────────────────

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/,/g, '')
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  // ── Variants ────────────────────────────────────────────

  const addVariant = () =>
    setVariants((prev) => [...prev, { id: genId(), name: '', values: '' }])

  const updateVariant = (id: string, field: 'name' | 'values', value: string) =>
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: value } : v)))

  const removeVariant = (id: string) =>
    setVariants((prev) => prev.filter((v) => v.id !== id))

  // ── Attributes ──────────────────────────────────────────

  const addAttribute = () =>
    setAttributes((prev) => [...prev, { id: genId(), key: '', value: '' }])

  const updateAttribute = (id: string, field: 'key' | 'value', value: string) =>
    setAttributes((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)))

  const removeAttribute = (id: string) =>
    setAttributes((prev) => prev.filter((a) => a.id !== id))

  // ── Submit ──────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const anyUploading = images.some((i) => i.uploading)
    if (anyUploading) return

    const fd = new FormData(formRef.current!)

    const imageUrls = images.filter((i) => i.uploadedUrl).map((i) => i.uploadedUrl!)
    fd.set('image_urls', JSON.stringify(imageUrls))
    fd.set('tags', JSON.stringify(tags))
    fd.set(
      'variants',
      JSON.stringify(
        variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            values: v.values.split(',').map((s) => s.trim()).filter(Boolean),
          }))
      )
    )
    fd.set(
      'attributes',
      JSON.stringify(
        attributes
          .filter((a) => a.key.trim())
          .map((a) => ({ key: a.key.trim(), value: a.value.trim() }))
      )
    )

    setIsSubmitting(true)
    startTransition(() => formAction(fd))
  }

  const anyUploading = images.some((i) => i.uploading)

  // ── Render ──────────────────────────────────────────────

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      {state?.error && (
        <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

        {/* ── Left column ── */}
        <div className="space-y-5">

          {/* Images */}
          <Card title="Product Images">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors ${
                dragOver
                  ? 'border-gray-400 bg-gray-100'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
              }`}
            >
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">
                  Drop images here, or{' '}
                  <span className="text-gray-900 underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, WebP up to 10 MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
            </div>

            {/* Gallery grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-4">
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group border border-gray-200"
                  >
                    <img src={img.preview} alt="" className="w-full h-full object-cover" />

                    {/* Uploading overlay */}
                    {img.uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}

                    {/* Error overlay */}
                    {img.error && (
                      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                        <span className="text-white text-xs px-1 text-center leading-tight">Upload failed</span>
                      </div>
                    )}

                    {/* Main badge */}
                    {i === 0 && !img.uploading && !img.error && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded font-medium">
                        Main
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id) }}
                      className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity text-gray-700 hover:text-red-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {anyUploading && (
              <p className="text-xs text-gray-400 mt-2">Uploading images, please wait…</p>
            )}
          </Card>

          {/* Product info */}
          <Card title="Product Information">
            <div className="space-y-4">
              <div>
                <FieldLabel>Product Name</FieldLabel>
                <input
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. NIV Study Bible"
                  className={inputCls}
                />
              </div>

              <div>
                <FieldLabel optional>URL Slug</FieldLabel>
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                  placeholder="niv-study-bible"
                  className={`${inputCls} font-mono`}
                />
                <p className="text-xs text-gray-400 mt-1">Auto-generated from product name.</p>
              </div>

              <div>
                <FieldLabel optional>Short Description</FieldLabel>
                <textarea
                  name="short_description"
                  defaultValue={product?.short_description ?? ''}
                  rows={2}
                  placeholder="One or two sentences summarising the product…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div>
                <FieldLabel optional>Full Description</FieldLabel>
                <textarea
                  name="description"
                  defaultValue={product?.description ?? ''}
                  rows={6}
                  placeholder="Detailed product description, features, specifications…"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>
          </Card>

          {/* Variants */}
          <Card title="Variants">
            <p className="text-xs text-gray-400 mb-3">
              e.g. Size: S, M, L, XL — or Format: Hardcover, Paperback
            </p>
            <div className="space-y-2">
              {variants.map((v) => (
                <div key={v.id} className="flex gap-2 items-center">
                  <input
                    value={v.name}
                    onChange={(e) => updateVariant(v.id, 'name', e.target.value)}
                    placeholder="Name (e.g. Size)"
                    className={`${inputCls} max-w-[140px]`}
                  />
                  <input
                    value={v.values}
                    onChange={(e) => updateVariant(v.id, 'values', e.target.value)}
                    placeholder="Values, comma-separated"
                    className={inputCls}
                  />
                  <RemoveBtn onClick={() => removeVariant(v.id)} />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addVariant}
              className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add variant
            </button>
          </Card>

          {/* Attributes */}
          <Card title="Attributes">
            <p className="text-xs text-gray-400 mb-3">
              e.g. Material: Leather, Language: English, Weight: 800g
            </p>
            <div className="space-y-2">
              {attributes.map((a) => (
                <div key={a.id} className="flex gap-2 items-center">
                  <input
                    value={a.key}
                    onChange={(e) => updateAttribute(a.id, 'key', e.target.value)}
                    placeholder="Attribute (e.g. Color)"
                    className={`${inputCls} max-w-[160px]`}
                  />
                  <input
                    value={a.value}
                    onChange={(e) => updateAttribute(a.id, 'value', e.target.value)}
                    placeholder="Value (e.g. Burgundy)"
                    className={inputCls}
                  />
                  <RemoveBtn onClick={() => removeAttribute(a.id)} />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addAttribute}
              className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add attribute
            </button>
          </Card>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5 xl:sticky xl:top-6 xl:self-start">

          {/* Publish */}
          <Card title="Publish">
            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={product ? product.is_active : true}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Active</p>
                  <p className="text-xs text-gray-400">Visible in the store</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  name="is_featured"
                  type="checkbox"
                  defaultChecked={product?.is_featured ?? false}
                  className="w-4 h-4 rounded border-gray-300 accent-gray-900"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Featured</p>
                  <p className="text-xs text-gray-400">Show on homepage</p>
                </div>
              </label>
            </div>
            <SubmitButton label={anyUploading ? 'Uploading images…' : submitLabel} />
            <Link
              href="/admin/products"
              className="block text-center mt-2.5 text-sm text-gray-400 hover:text-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </Card>

          {/* Pricing */}
          <Card title="Pricing">
            <div className="space-y-3">
              <div>
                <FieldLabel>Price (₦)</FieldLabel>
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.price ?? ''}
                  required
                  placeholder="0.00"
                  className={inputCls}
                />
              </div>
              <div>
                <FieldLabel optional>Compare-at Price (₦)</FieldLabel>
                <input
                  name="compare_at_price"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={product?.compare_at_price ?? ''}
                  placeholder="0.00"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Shows as a strikethrough "was" price.</p>
              </div>
            </div>
          </Card>

          {/* Category */}
          <Card title="Organisation">
            <div>
              <FieldLabel>Category</FieldLabel>
              <select
                name="category_id"
                defaultValue={product?.category_id ?? ''}
                className={selectCls}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* Tags */}
          <Card title="Tags">
            <div
              className="flex flex-wrap gap-1.5 p-3 border border-gray-200 rounded-lg min-h-[44px] cursor-text"
              onClick={() => document.getElementById('tag-input')?.focus()}
            >
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="text-gray-400 hover:text-gray-700 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => tagInput && addTag(tagInput)}
                placeholder={tags.length === 0 ? 'Type and press Enter…' : ''}
                className="flex-1 min-w-[80px] text-sm outline-none bg-transparent placeholder:text-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Press Enter or comma to add a tag.</p>
          </Card>

          {/* Shipping */}
          <Card title="Shipping">
            <select
              name="shipping_type"
              defaultValue={product?.shipping_type ?? 'standard'}
              className={selectCls}
            >
              <option value="standard">Standard Delivery</option>
              <option value="express">Express Delivery</option>
              <option value="free">Free Shipping</option>
              <option value="pickup">Store Pickup</option>
              <option value="digital">Digital / Download</option>
            </select>
          </Card>

          {/* Inventory */}
          <Card title="Inventory">
            <div>
              <FieldLabel>Stock Quantity</FieldLabel>
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
                className={inputCls}
              />
            </div>
          </Card>

        </div>
      </div>
    </form>
  )
}
