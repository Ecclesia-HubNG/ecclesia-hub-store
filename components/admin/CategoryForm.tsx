'use client'

import { useFormState } from 'react-dom'
import { useEffect, useState, useTransition } from 'react'
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

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600'

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
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(!!category)

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(name))
  }, [name, slugEdited])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => { formAction(fd) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state?.error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Details</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
          <input
            name="name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="e.g. Books"
            className={inputCls}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Slug</label>
          <input
            name="slug"
            value={slug}
            onChange={e => { setSlug(e.target.value); setSlugEdited(true) }}
            required
            placeholder="books"
            className={`${inputCls} font-mono`}
          />
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Auto-generated from name.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description <span className="text-gray-400 dark:text-gray-600 font-normal text-xs">(optional)</span>
          </label>
          <textarea
            name="description"
            defaultValue={category?.description ?? ''}
            rows={3}
            placeholder="Optional description…"
            className={`${inputCls} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Image URL <span className="text-gray-400 dark:text-gray-600 font-normal text-xs">(optional)</span>
          </label>
          <input
            name="image"
            type="url"
            defaultValue={category?.image ?? ''}
            placeholder="https://…"
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <Link href="/admin/categories" className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          Cancel
        </Link>
      </div>
    </form>
  )
}
