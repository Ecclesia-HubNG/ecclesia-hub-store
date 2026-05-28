'use client'

import { useRef, useState, useTransition, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import { getMediaAssets } from '@/lib/actions/media'
import { upsertHeroWidget } from '@/lib/actions/homepage'
import MediaLibrary from '@/components/admin/MediaLibrary'

type Slide = {
  id: string
  image?: string | null
  heading?: string | null
  subheading?: string | null
  cta_label?: string | null
  cta_href?: string | null
}

type Product = { id: string; name: string; thumbnail: string | null }

type Props = {
  initialConfig: {
    slides?: Slide[]
    hero_image?: string | null
    product_id?: string | null
    category_id?: string | null
  } | null
  products: Product[]
  categories: { id: string; name: string }[]
  mediaAssets: Awaited<ReturnType<typeof getMediaAssets>>
}

const inputCls =
  'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600'

function newSlide(): Slide {
  return { id: crypto.randomUUID(), image: null, heading: null, subheading: null, cta_label: null, cta_href: null }
}

function normalizeInitial(config: Props['initialConfig']): Slide[] {
  if (!config) return []
  if (config.slides?.length) return config.slides
  if (config.hero_image) return [{ id: 'legacy', image: config.hero_image }]
  return []
}

export default function HeroWidgetEditor({ initialConfig, products, mediaAssets }: Props) {
  const [slides, setSlides] = useState<Slide[]>(() => normalizeInitial(initialConfig))
  const [productId, setProductId] = useState(initialConfig?.product_id ?? '')

  const [uploading, setUploading] = useState<string | null>(null) // slide id being uploaded
  const [uploadError, setUploadError] = useState('')
  const [pickerSlideId, setPickerSlideId] = useState<string | null>(null)
  const [toast, setToast] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isPending, startTransition] = useTransition()

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const updateSlide = (id: string, patch: Partial<Slide>) =>
    setSlides(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const removeSlide = (id: string) =>
    setSlides(prev => prev.filter(s => s.id !== id))

  const moveSlide = (id: string, dir: -1 | 1) =>
    setSlides(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx < 0) return prev
      const next = idx + dir
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })

  const resizeImage = (file: File, maxDim = 2000): Promise<File> =>
    new Promise((resolve) => {
      const img = new Image()
      const blobUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(blobUrl)
        const { width, height } = img
        if (width <= maxDim && height <= maxDim) { resolve(file); return }
        const scale = Math.min(maxDim / width, maxDim / height)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(width * scale)
        canvas.height = Math.round(height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          blob => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file),
          'image/jpeg', 0.85
        )
      }
      img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file) }
      img.src = blobUrl
    })

  const uploadFile = async (slideId: string, file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Only image files are allowed'); return }
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10 MB'); return }
    setUploading(slideId)
    setUploadError('')
    const resized = await resizeImage(file, 2000)
    const fd = new FormData()
    fd.append('file', resized)
    fd.append('folder', 'homepage')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const result = await res.json() as { url?: string; error?: string }
    setUploading(null)
    if (!res.ok || result.error) { setUploadError(result.error ?? 'Upload failed'); return }
    updateSlide(slideId, { image: result.url ?? null })
  }

  const handleFileInput = (slideId: string) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(slideId, file)
    e.target.value = ''
  }

  const handleSave = () => {
    setSaveError('')
    startTransition(async () => {
      try {
        await upsertHeroWidget({
          slides,
          product_id: productId || null,
          category_id: null,
        })
        setToast(true)
        setTimeout(() => setToast(false), 4000)
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  const selectedProduct = products.find(p => p.id === productId) ?? null

  return (
    <div>
      {/* Success toast */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl transition-all duration-300 whitespace-nowrap ${toast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <span className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </span>
        Saved — homepage updated
        <button type="button" onClick={() => setToast(false)} className="ml-1 text-white/40 hover:text-white transition-colors">×</button>
      </div>

      {/* Error toast */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-red-600 text-white text-sm rounded-xl shadow-xl transition-all duration-300 whitespace-nowrap ${saveError ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        {saveError}
        <button type="button" onClick={() => setSaveError('')} className="ml-1 text-white/60 hover:text-white transition-colors">×</button>
      </div>

      {/* ── Slides ── */}
      <div className="py-6 border-b border-gray-100 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Hero Slides</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
              Add multiple slides that will auto-cycle in the hero section. Each slide can have its own image, headline, and call-to-action.
            </p>
          </div>
          <div className="md:col-span-2 space-y-4">
            {slides.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                No slides yet. Add your first slide below.
              </p>
            )}

            {slides.map((slide, idx) => (
              <div key={slide.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Slide header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Slide {idx + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSlide(slide.id, -1)}
                      disabled={idx === 0}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(slide.id, 1)}
                      disabled={idx === slides.length - 1}
                      className="w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSlide(slide.id)}
                      className="w-7 h-7 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove slide"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  {/* Image */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Background Image</label>
                    {slide.image ? (
                      <div className="relative group">
                        <div className="w-full h-36 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <img src={slide.image} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slide.id]?.click()}
                            className="px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >Replace</button>
                          <button
                            type="button"
                            onClick={() => setPickerSlideId(slide.id)}
                            className="px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >Library</button>
                          <button
                            type="button"
                            onClick={() => updateSlide(slide.id, { image: null })}
                            className="px-2.5 py-1 bg-white dark:bg-gray-800 text-red-500 text-xs font-medium rounded-lg shadow hover:bg-red-50 dark:hover:bg-gray-700 transition-colors"
                          >Remove</button>
                        </div>
                        {uploading === slide.id && (
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[slide.id]?.click()}
                        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-6 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {uploading === slide.id ? (
                          <svg className="w-6 h-6 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z" />
                          </svg>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {uploading === slide.id ? 'Uploading…' : 'Upload image'}
                        </p>
                      </div>
                    )}
                    {!slide.image && (
                      <button
                        type="button"
                        onClick={() => setPickerSlideId(slide.id)}
                        className="mt-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
                      >
                        Or pick from media library
                      </button>
                    )}
                    <input
                      ref={el => { fileInputRefs.current[slide.id] = el }}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput(slide.id)}
                      className="hidden"
                    />
                  </div>

                  {/* Heading */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Heading <span className="normal-case font-normal">(optional)</span></label>
                      <span className="text-[10px] text-gray-400 dark:text-gray-600">Press Enter for a line break</span>
                    </div>
                    <textarea
                      rows={3}
                      value={slide.heading ?? ''}
                      onChange={e => updateSlide(slide.id, { heading: e.target.value || null })}
                      placeholder={'Bibles, Books\n& Christian Resources'}
                      className={`${inputCls} resize-none leading-relaxed`}
                    />
                  </div>

                  {/* Subheading */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Subheading <span className="normal-case font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={slide.subheading ?? ''}
                      onChange={e => updateSlide(slide.id, { subheading: e.target.value || null })}
                      placeholder="Premium body care crafted for you."
                      className={inputCls}
                    />
                  </div>

                  {/* CTA */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Button label</label>
                      <input
                        type="text"
                        value={slide.cta_label ?? ''}
                        onChange={e => updateSlide(slide.id, { cta_label: e.target.value || null })}
                        placeholder="Shop Now"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Button link</label>
                      <input
                        type="text"
                        value={slide.cta_href ?? ''}
                        onChange={e => updateSlide(slide.id, { cta_href: e.target.value || null })}
                        placeholder="/shop"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setSlides(prev => [...prev, newSlide()])}
              className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add slide
            </button>

            {uploadError && (
              <p className="text-sm text-red-500 dark:text-red-400">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Featured Product ── */}
      <div className="py-6 border-b border-gray-100 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Featured Product</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
              Shown in the corner card on the hero across all slides.
            </p>
          </div>
          <div className="md:col-span-2">
            <select value={productId} onChange={e => setProductId(e.target.value)} className={inputCls}>
              <option value="">— None —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Save ── */}
      <div className="pt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !!uploading}
          className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isPending && (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Media picker modal */}
      {pickerSlideId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Media Library</h2>
              <button
                type="button"
                onClick={() => setPickerSlideId(null)}
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
                  updateSlide(pickerSlideId, { image: asset.url })
                  setPickerSlideId(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
