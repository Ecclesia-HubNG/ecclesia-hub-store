'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
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

export default function CategoryForm({
  action,
  category,
  submitLabel = 'Save category',
}: {
  action: ActionFn
  category?: Category
  submitLabel?: string
}) {
  const [state, formAction] = useFormState(action, null)
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!category)

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

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Books"
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
            placeholder="books"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Auto-generated from name.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            defaultValue={category?.description ?? ''}
            rows={3}
            placeholder="Optional description…"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
          <input
            name="image"
            type="url"
            defaultValue={category?.image ?? ''}
            placeholder="https://…"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pb-8">
        <SubmitButton label={submitLabel} />
        <Link href="/admin/categories" className="px-5 py-2.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
