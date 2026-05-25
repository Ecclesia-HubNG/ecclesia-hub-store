'use client'

import { useFormState } from 'react-dom'
import { useEffect, useRef, useState, useTransition } from 'react'
import type { DragEvent, ChangeEvent, FormEvent } from 'react'
import { resizeImage } from '@/lib/resize-image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import CategoriesSideList from '@/components/admin/CategoriesSideList'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  is_featured: boolean
  parent_id?: string | null
}

type ActionResult = { error: string } | { success: true; id?: string } | undefined | null
type ActionFn = (state: ActionResult, formData: FormData) => Promise<ActionResult>

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600'

export default function CategoryForm({
  action,
  category,
  submitLabel = 'Save category',
  categories,
}: {
  action: ActionFn
  category?: Category
  submitLabel?: string
  categories?: Category[]
}) {
  const router = useRouter()
  const [state, formAction] = useFormState(action, null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!category)
  const [description, setDescription] = useState(category?.description ?? '')
  const [isFeatured, setIsFeatured] = useState(category?.is_featured ?? false)
  const [parentId, setParentId] = useState(category?.parent_id ?? '')
  const [isSubcategory, setIsSubcategory] = useState(!!(category?.parent_id))

  const [imagePreview, setImagePreview] = useState<string | null>(category?.image ?? null)
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name))
  }, [name, slugEdited])

  useEffect(() => {
    if (state && 'success' in state) {
      setToast(true)
      router.refresh()
      // Reset form when creating (not editing)
      if (!category) {
        setName('')
        setSlug('')
        setSlugEdited(false)
        setDescription('')
        setIsFeatured(false)
        setIsSubcategory(false)
        setParentId('')
        setImagePreview(null)
        setImageUrl(null)
      }
      const t = setTimeout(() => setToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [state])

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setUploadError('Only image files allowed'); return }
    setUploading(true); setUploadError('')
    const preview = URL.createObjectURL(file)
    setImagePreview(preview)
    const resized = await resizeImage(file, 2000)
    const fd = new FormData()
    fd.append('file', resized)
    fd.append('folder', 'categories')
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const json = await res.json()
    setUploading(false)
    if (!res.ok) { setUploadError(json.error ?? 'Upload failed'); setImagePreview(null); return }
    setImageUrl(json.url)
    setImagePreview(json.url)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
    e.target.value = ''
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (uploading) return
    const fd = new FormData(formRef.current!)
    fd.set('image', imageUrl ?? '')
    fd.set('parent_id', isSubcategory ? parentId : '')
    startTransition(() => { formAction(fd) })
  }

  const hasRightCol = categories !== undefined

  return (
    <form ref={formRef} onSubmit={handleSubmit}>

      {/* Progress bar */}
      <div className={`fixed top-0 left-0 right-0 z-50 h-0.5 transition-opacity duration-300 ${isPending ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`h-full bg-gray-900 dark:bg-white transition-all duration-[2000ms] ease-out ${isPending ? 'w-4/5' : 'w-0'}`} />
      </div>

      {/* Success toast */}
      <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-xl transition-all duration-300 ease-out whitespace-nowrap ${toast ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <span className="flex items-center justify-center w-5 h-5 bg-green-500 rounded-full shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </span>
        Category saved
        <button type="button" onClick={() => setToast(false)} className="ml-1 text-white/40 hover:text-white transition-colors text-base leading-none">×</button>
      </div>

      {state && 'error' in state && (
        <div className="mb-5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <div className={`grid gap-6 ${hasRightCol ? 'grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]' : 'grid-cols-1 max-w-2xl'}`}>

        {/* Left — form fields */}
        <div className="space-y-5 min-w-0">

          {/* Image */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Category Image</h2>

            {imagePreview ? (
              <div className="relative group">
                <div className="w-full h-52 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                      <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    Replace
                  </button>
                  <button type="button" onClick={() => { setImagePreview(null); setImageUrl(null) }}
                    className="px-3 py-1.5 bg-white dark:bg-gray-800 text-red-500 text-xs font-medium rounded-lg shadow hover:bg-red-50 dark:hover:bg-gray-700 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-10 cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-gray-400 bg-gray-100 dark:bg-gray-800'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Drop image here, or <span className="text-gray-900 dark:text-white underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600">PNG, JPG, WebP up to 10 MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            {uploadError && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{uploadError}</p>}
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">Used as the hero image on the category page.</p>
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
              <input name="name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Bibles" className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">URL Slug</label>
              <input name="slug" value={slug} onChange={e => { setSlug(slugify(e.target.value)); setSlugEdited(true) }} required placeholder="bibles" className={`${inputCls} font-mono`} />
              <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Auto-generated from name.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span className="text-xs font-normal text-gray-400 dark:text-gray-600">(optional)</span>
              </label>
              <textarea name="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="A short description shown on the category page…" className={`${inputCls} resize-none`} />
            </div>

            {/* Subcategory toggle — only shown when there are root categories to nest under */}
            {categories && categories.filter(c => !c.parent_id && c.id !== category?.id).length > 0 && (
              <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => { setIsSubcategory(p => !p); setParentId('') }}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0 ${isSubcategory ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSubcategory && (
                      <svg className="w-2.5 h-2.5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">This is a subcategory</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">Nest it under an existing category</p>
                  </div>
                </label>

                {isSubcategory && (
                  <div className="mt-3 ml-7">
                    <select
                      value={parentId}
                      onChange={e => setParentId(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select a parent category…</option>
                      {categories
                        .filter(c => !c.parent_id && c.id !== category?.id)
                        .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Marketing */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <h2 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Marketing</h2>
            <label className="flex items-center gap-3 cursor-pointer">
              <input name="is_featured" type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Featured category</p>
                <p className="text-xs text-gray-400 dark:text-gray-600">Highlight this category on the homepage and shop page</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pb-8">
            <button type="submit" disabled={isPending || uploading}
              className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              {isPending && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {uploading ? 'Uploading image…' : isPending ? 'Saving…' : submitLabel}
            </button>
            <Link href="/admin/categories" className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancel
            </Link>
          </div>
        </div>

        {/* Right — categories list (new page only) */}
        {hasRightCol && (
          <div className="min-w-0">
            <CategoriesSideList categories={categories} />
          </div>
        )}
      </div>
    </form>
  )
}
