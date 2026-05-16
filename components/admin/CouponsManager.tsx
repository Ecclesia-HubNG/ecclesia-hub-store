'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCoupon, updateCoupon, deleteCoupon, toggleCouponActive } from '@/lib/actions/coupons'

type Coupon = {
  id: string
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

type AppliesTo = 'all' | 'products' | 'categories'

type FormState = {
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  min_order_amount: string
  max_uses: string
  expires_at: string
  is_active: boolean
  applies_to: AppliesTo
  product_ids: string[]
  category_ids: string[]
}

const empty: FormState = {
  code: '', description: '', discount_type: 'percentage',
  discount_value: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: true,
  applies_to: 'all', product_ids: [], category_ids: [],
}

const inputCls = 'w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600'
const selectCls = 'w-full pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors appearance-none'

function fmt(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  if (d < now) return { label: 'Expired ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), expired: true }
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), expired: false }
}

type Product = { id: string; name: string; thumbnail: string | null }
type Category = { id: string; name: string }

export default function CouponsManager({ coupons: initial, products, categories }: { coupons: Coupon[]; products: Product[]; categories: Category[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [coupons, setCoupons] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const set = (key: keyof FormState, val: string | boolean | string[]) =>
    setForm(f => ({ ...f, [key]: val }))

  const openCreate = () => {
    setEditingId(null)
    setForm(empty)
    setError('')
    setShowForm(true)
  }

  const openEdit = (c: Coupon) => {
    setEditingId(c.id)
    setForm({
      code: c.code,
      description: c.description ?? '',
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      min_order_amount: c.min_order_amount != null ? String(c.min_order_amount) : '',
      max_uses: c.max_uses != null ? String(c.max_uses) : '',
      expires_at: c.expires_at ? new Date(c.expires_at).toISOString().slice(0, 16) : '',
      is_active: c.is_active,
      applies_to: (c as any).applies_to ?? 'all',
      product_ids: (c as any).product_ids ?? [],
      category_ids: (c as any).category_ids ?? [],
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditingId(null); setError('') }

  const handleSubmit = () => {
    if (!form.code.trim() || !form.discount_value) { setError('Code and discount value are required'); return }
    const input = {
      code: form.code,
      description: form.description || '',
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
      applies_to: form.applies_to,
      product_ids: form.applies_to === 'products' ? form.product_ids : [],
      category_ids: form.applies_to === 'categories' ? form.category_ids : [],
    }
    startTransition(async () => {
      const result = editingId ? await updateCoupon(editingId, input) : await createCoupon(input)
      if (result && 'error' in result) { setError(result.error ?? 'Something went wrong'); return }
      closeForm()
      router.refresh()
    })
  }

  const handleDelete = (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This can't be undone.`)) return
    setCoupons(prev => prev.filter(c => c.id !== id))
    startTransition(async () => {
      await deleteCoupon(id)
      router.refresh()
    })
  }

  const handleToggleActive = (id: string, current: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
    startTransition(async () => {
      await toggleCouponActive(id, !current)
      router.refresh()
    })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const active = coupons.filter(c => c.is_active).length
  const expired = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Coupons</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {coupons.length} total · {active} active{expired > 0 ? ` · ${expired} expired` : ''}
          </p>
        </div>
        {!showForm && (
          <button onClick={openCreate}
            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
            Add coupon
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{editingId ? 'Edit coupon' : 'New coupon'}</h2>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl leading-none">×</button>
          </div>

          {error && <p className="text-sm text-red-500 dark:text-red-400 mb-4">{error}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Code *</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="SAVE20" className={`${inputCls} font-mono tracking-widest uppercase`} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Discount type *</label>
              <div className="relative">
                <select value={form.discount_type} onChange={e => set('discount_type', e.target.value)} className={selectCls}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed amount (₦)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Value * {form.discount_type === 'percentage' ? '(%)' : '(₦)'}
              </label>
              <input type="number" min="0" step="any" value={form.discount_value} onChange={e => set('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? '20' : '500'} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Min order (₦) <span className="text-gray-400">(optional)</span></label>
              <input type="number" min="0" step="any" value={form.min_order_amount} onChange={e => set('min_order_amount', e.target.value)}
                placeholder="5000" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Max uses <span className="text-gray-400">(optional — blank = unlimited)</span></label>
              <input type="number" min="1" step="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)}
                placeholder="100" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Expires at <span className="text-gray-400">(optional)</span></label>
              <input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Applies to</label>
              <div className="flex gap-2">
                {(['all', 'products', 'categories'] as AppliesTo[]).map(opt => (
                  <button key={opt} type="button" onClick={() => set('applies_to', opt)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize ${form.applies_to === opt ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                    {opt === 'all' ? 'All products' : opt === 'products' ? 'Specific products' : 'Specific categories'}
                  </button>
                ))}
              </div>

              {/* Product picker */}
              {form.applies_to === 'products' && (
                <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox" checked={form.product_ids.includes(p.id)}
                        onChange={e => set('product_ids', e.target.checked ? [...form.product_ids, p.id] : form.product_ids.filter(id => id !== p.id))}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                      {p.thumbnail && <img src={p.thumbnail} alt="" className="w-6 h-6 rounded object-cover shrink-0" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Category picker */}
              {form.applies_to === 'categories' && (
                <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {categories.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox" checked={form.category_ids.includes(c.id)}
                        onChange={e => set('category_ids', e.target.checked ? [...form.category_ids, c.id] : form.category_ids.filter(id => id !== c.id))}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description <span className="text-gray-400">(optional)</span></label>
              <input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="e.g. 20% off for newsletter subscribers" className={inputCls} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 accent-gray-900" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
            <div className="flex items-center gap-3">
              <button onClick={closeForm} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={isPending}
                className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {editingId ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {coupons.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <p className="text-sm text-gray-400 dark:text-gray-600">No coupons yet.</p>
          <button onClick={openCreate} className="text-sm text-gray-900 dark:text-white font-medium mt-2 hover:underline">Create your first coupon →</button>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Min order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Uses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {coupons.map(c => {
                const expiry = formatExpiry(c.expires_at)
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 dark:text-white tracking-wide">{c.code}</span>
                        <button type="button" onClick={() => copyCode(c.code)}
                          className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" title="Copy">
                          {copied === c.code ? (
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {c.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[160px]">{c.description}</p>}
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₦${fmt(c.discount_value)}`}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">off</span>
                      {(c as any).applies_to && (c as any).applies_to !== 'all' && (
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                          {(c as any).applies_to === 'products'
                            ? `${((c as any).product_ids ?? []).length} product(s)`
                            : `${((c as any).category_ids ?? []).length} categor${((c as any).category_ids ?? []).length === 1 ? 'y' : 'ies'}`}
                        </p>
                      )}
                    </td>

                    {/* Min order */}
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600 dark:text-gray-400">
                      {c.min_order_amount ? `₦${fmt(c.min_order_amount)}` : <span className="text-gray-300 dark:text-gray-700">—</span>}
                    </td>

                    {/* Uses */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-700 dark:text-gray-300">{c.used_count}</span>
                      <span className="text-gray-400 dark:text-gray-600"> / {c.max_uses ?? '∞'}</span>
                    </td>

                    {/* Expires */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {expiry ? (
                        <span className={`text-sm ${expiry.expired ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {expiry.label}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">Never</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleToggleActive(c.id, c.is_active)} disabled={isPending}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${c.is_active ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4 justify-end">
                        <button type="button" onClick={() => openEdit(c)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Edit</button>
                        <button type="button" onClick={() => handleDelete(c.id, c.code)}
                          className="text-sm text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
