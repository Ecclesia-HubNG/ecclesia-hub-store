'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import type { DragEvent, ChangeEvent } from 'react'
import { uploadMedia, getMediaAssets } from '@/lib/actions/media'
import { upsertHeroWidget } from '@/lib/actions/homepage'
import MediaLibrary from '@/components/admin/MediaLibrary'

type Product = { id: string; name: string; thumbnail: string | null }

function ProductPicker({
  products,
  value,
  onChange,
}: {
  products: Product[]
  value: string
  onChange: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = products.find(p => p.id === value) ?? null
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(p => !p); setSearch('') }}
        className="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        {selected ? (
          <>
            {selected.thumbnail ? (
              <img src={selected.thumbnail} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 shrink-0" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white flex-1 truncate">{selected.name}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-400 dark:text-gray-500 flex-1">— None selected —</span>
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              autoFocus
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
            />
          </div>
          <div className="overflow-y-auto max-h-56">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                !value ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <div className="w-8 h-8 rounded-md border-2 border-dashed border-gray-200 dark:border-gray-700 shrink-0" />
              None
            </button>
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-sm text-center text-gray-400">No products match</p>
            )}
            {filtered.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  value === p.id ? 'bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-gray-100 dark:bg-gray-700 shrink-0" />
                )}
                <span className={`truncate ${value === p.id ? 'font-medium text-[#4A0F1C] dark:text-[#D4849A]' : 'text-gray-700 dark:text-gray-300'}`}>
                  {p.name}
                </span>
                {value === p.id && (
                  <svg className="w-4 h-4 text-[#4A0F1C] dark:text-[#D4849A] shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

type HeroConfig = {
  hero_image?: string | null
  product_id?: string | null
  category_id?: string | null
}

type Props = {
  initialConfig: HeroConfig | null
  products: { id: string; name: string; thumbnail: string | null }[]
  categories: { id: string; name: string }[]
  mediaAssets: Awaited<ReturnType<typeof getMediaAssets>>
}

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600'

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-gray-100 dark:border-white/10 last:border-0">
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  )
}

export default function HeroWidgetEditor({ initialConfig, products, categories, mediaAssets }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [heroImage, setHeroImage] = useState<string | null>(initialConfig?.hero_image ?? null)
  const [imagePreview, setImagePreview] = useState<string | null>(initialConfig?.hero_image ?? null)
  const [productId, setProductId] = useState<string>(initialConfig?.product_id ?? '')
  const [categoryId, setCategoryId] = useState<string>(initialConfig?.category_id ?? '')

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [toast, setToast] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isPending, startTransition] = useTransition()

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files allowed')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File exceeds 10 MB')
      return
    }
    setUploading(true)
    setUploadError('')
    setImagePreview(URL.createObjectURL(file))

    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadMedia(fd, 'homepage')
    setUploading(false)

    if (result.error) {
      setUploadError(result.error)
      setImagePreview(heroImage)
      return
    }

    const url = result.url ?? null
    setHeroImage(url)
    setImagePreview(url)

    // Auto-save immediately so the hero updates without needing a manual save
    startTransition(async () => {
      try {
        await upsertHeroWidget({
          hero_image: url,
          product_id: productId || null,
          category_id: categoryId || null,
        })
        setToast(true)
        setTimeout(() => setToast(false), 3000)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const handleSave = () => {
    setSaveError('')
    startTransition(async () => {
      try {
        await upsertHeroWidget({
          hero_image: heroImage || null,
          product_id: productId || null,
          category_id: categoryId || null,
        })
        setToast(true)
        setTimeout(() => setToast(false), 4000)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  return (
    <div>
      {/* Success toast */}
      <div
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl transition-all duration-300 ease-out whitespace-nowrap ${
          toast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <span className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </span>
        Saved
        <button
          type="button"
          onClick={() => setToast(false)}
          className="ml-1 text-white/40 hover:text-white transition-colors text-base leading-none"
        >
          ×
        </button>
      </div>

      {/* Hero Image */}
      <Section title="Hero Image" description="Upload the banner image displayed in the hero section of your homepage.">
        <div className="space-y-3">
          {/* Preview or drop zone */}
          {imagePreview ? (
            <div className="relative group">
              <div className="w-full h-48 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800">
                <img src={imagePreview} alt="Hero preview" className="w-full h-full object-cover" />
              </div>
              {!uploading && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => { setHeroImage(null); setImagePreview(null) }}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-red-500 text-xs font-medium rounded-lg shadow hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-10 transition-colors ${
                uploading
                  ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-wait'
                  : dragOver
                  ? 'border-gray-400 bg-gray-100 dark:bg-gray-800 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
              }`}
            >
              {uploading ? (
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              )}
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {uploading ? 'Uploading image…' : <>Drop image here, or <span className="text-gray-900 dark:text-white underline underline-offset-2">browse</span></>}
              </p>
              {!uploading && <p className="text-xs text-gray-400 dark:text-gray-600">PNG, JPG, WebP up to 10 MB</p>}
            </div>
          )}

          {/* Inline upload / save status */}
          {uploading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg">
              <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-blue-700 dark:text-blue-300">Uploading image to Cloudflare R2…</span>
            </div>
          )}
          {isPending && !uploading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <svg className="w-4 h-4 text-gray-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-gray-500 dark:text-gray-400">Saving to homepage…</span>
            </div>
          )}
          {uploadError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-lg">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <span className="text-sm text-red-600 dark:text-red-400">{uploadError}</span>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />

          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline underline-offset-2 transition-colors"
          >
            Or pick from media library
          </button>
        </div>
      </Section>

      {/* Media picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Media Library</h2>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-6">
              <MediaLibrary
                initialAssets={mediaAssets}
                onSelect={asset => {
                  setHeroImage(asset.url)
                  setImagePreview(asset.url)
                  setShowPicker(false)
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Featured Product */}
      <Section
        title="Featured Product"
        description="Select a product to feature in the hero section. Leave empty to show no product."
      >
        <ProductPicker products={products} value={productId} onChange={setProductId} />
      </Section>

      {/* Featured Category */}
      <Section
        title="Featured Category"
        description="Select a category to highlight in the hero section. Leave empty to show no category."
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
            <option value="">— None —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Save */}
      <div className="pt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || uploading}
          className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {uploading ? 'Uploading image…' : isPending ? 'Saving…' : 'Save changes'}
        </button>
        {saveError && <p className="text-sm text-red-500 dark:text-red-400">{saveError}</p>}
      </div>
    </div>
  )
}
