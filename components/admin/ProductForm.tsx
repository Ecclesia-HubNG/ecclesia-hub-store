'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Category = { id: string; name: string }
type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  category_id: string | null
  thumbnail: string | null
  images: string[] | null
  stock: number
  is_featured: boolean
  is_active: boolean
}
type ActionResult = { error: string } | undefined | null
type ActionFn = (state: ActionResult, formData: FormData) => Promise<ActionResult>

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Saving…' : label}
    </button>
  )
}

export default function ProductForm({
  action,
  product,
  categories,
  submitLabel = 'Save product',
}: {
  action: ActionFn
  product?: Product
  categories: Category[]
  submitLabel?: string
}) {
  const [state, formAction] = useFormState(action, null)
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!product)

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name))
  }, [name, slugEdited])

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Basic info</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Study Bible"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
          <input
            name="slug"
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
            required
            placeholder="study-bible"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Used in URLs. Auto-generated from name.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            defaultValue={product?.description ?? ''}
            rows={4}
            placeholder="Product description…"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Pricing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.price ?? ''}
              required
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Compare at price</label>
            <input
              name="compare_at_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={product?.compare_at_price ?? ''}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Inventory</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock quantity</label>
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock ?? 0}
            className="w-full max-w-xs px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      {/* Organization */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Organization</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            name="category_id"
            defaultValue={product?.category_id ?? ''}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">No category</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={product ? product.is_active : true}
              className="w-4 h-4 rounded border-gray-300 accent-gray-900"
            />
            <span className="text-sm text-gray-700">
              Active <span className="text-gray-400">(visible in store)</span>
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              name="is_featured"
              type="checkbox"
              defaultChecked={product?.is_featured ?? false}
              className="w-4 h-4 rounded border-gray-300 accent-gray-900"
            />
            <span className="text-sm text-gray-700">
              Featured <span className="text-gray-400">(show on homepage)</span>
            </span>
          </label>
        </div>
      </div>

      {/* Media */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Media</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Thumbnail URL</label>
          <input
            name="thumbnail"
            type="url"
            defaultValue={product?.thumbnail ?? ''}
            placeholder="https://…"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional images</label>
          <textarea
            name="images"
            defaultValue={product?.images?.join('\n') ?? ''}
            rows={4}
            placeholder={'One URL per line\nhttps://…\nhttps://…'}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">One URL per line.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/products" className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
