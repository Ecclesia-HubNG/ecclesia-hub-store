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
  applies_to: 'all' | 'products' | 'categories'
  product_ids: string[]
  category_ids: string[]
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

type Product = { id: string; name: string; thumbnail: string | null }
type Category = { id: string; name: string }

const empty: FormState = {
  code: '', description: '', discount_type: 'percentage',
  discount_value: '', min_order_amount: '', max_uses: '', expires_at: '', is_active: true,
  applies_to: 'all', product_ids: [], category_ids: [],
}

const inputCls = 'w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 focus:border-gray-400 dark:focus:border-gray-500 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-600'
const labelCls = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide'

function fmt(n: number) { return n.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function formatExpiry(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  if (d < now) return { label: 'Expired ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), expired: true }
  return { label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }), expired: false }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function CouponsManager({ coupons: initial, products, categories, linkedCouponCode }: {
  coupons: Coupon[]
  products: Product[]
  categories: Category[]
  linkedCouponCode: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [coupons, setCoupons] = useState(initial)

  // View: 'list' | 'create' | 'edit'
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [error, setError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')

  const set = (key: keyof FormState, val: string | boolean | string[]) =>
    setForm(f => ({ ...f, [key]: val }))

  const openCreate = () => { setEditingId(null); setForm(empty); setError(''); setView('create') }

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
      applies_to: c.applies_to ?? 'all',
      product_ids: c.product_ids ?? [],
      category_ids: c.category_ids ?? [],
    })
    setError('')
    setView('edit')
  }

  const goBack = () => { setView('list'); setEditingId(null); setError('') }

  const handleSubmit = () => {
    if (!form.code.trim()) { setError('Coupon code is required'); return }
    if (!form.discount_value) { setError('Discount value is required'); return }
    if (form.applies_to === 'products' && form.product_ids.length === 0) { setError('Select at least one product'); return }
    if (form.applies_to === 'categories' && form.category_ids.length === 0) { setError('Select at least one category'); return }

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
      goBack()
      router.refresh()
    })
  }

  const handleDelete = (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This can't be undone.`)) return
    setDeleteError('')
    startTransition(async () => {
      const result = await deleteCoupon(id)
      if (result && 'error' in result) { setDeleteError(result.error); return }
      setCoupons(prev => prev.filter(c => c.id !== id))
      router.refresh()
    })
  }

  const handleToggleActive = (id: string, current: boolean) => {
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c))
    startTransition(async () => { await toggleCouponActive(id, !current); router.refresh() })
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const active = coupons.filter(c => c.is_active).length
  const expired = coupons.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))

  const linkedCoupon = linkedCouponCode ? coupons.find(c => c.code === linkedCouponCode) : null
  const isEditingLinkedCoupon = view === 'edit' && !!linkedCoupon && editingId === linkedCoupon.id

  // ─── CREATE / EDIT FORM ───────────────────────────────────────────────────
  if (view === 'create' || view === 'edit') {
    return (
      <div className="max-w-2xl">
        {/* Back nav */}
        <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to coupons
        </button>

        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {view === 'edit' ? `Edit ${form.code || 'coupon'}` : 'Create coupon'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {view === 'edit' ? 'Update the coupon details below.' : 'Set up a discount code for your customers.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isEditingLinkedCoupon && (
          <div className="mb-4 px-4 py-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-400">
            This coupon powers the newsletter popup. Renaming it, changing its % value, or toggling it active updates the popup automatically. If you switch it to a fixed ₦ amount, the popup's displayed % won't update on its own — edit the popup copy manually from /admin/popup afterward.
          </div>
        )}

        <div className="space-y-4">
          {/* Code + Description */}
          <Section title="Coupon details">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Coupon code *</label>
                <input
                  value={form.code}
                  onChange={e => set('code', e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE20"
                  className={`${inputCls} font-mono tracking-widest uppercase text-base`}
                />
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1.5">Customers enter this at checkout. Use uppercase letters and numbers.</p>
              </div>
              <div>
                <label className={labelCls}>Description <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                <input
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="e.g. 20% off for newsletter subscribers"
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* Discount */}
          <Section title="Discount">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['percentage', 'fixed'] as const).map(t => (
                    <button key={t} type="button" onClick={() => set('discount_type', t)}
                      className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors ${form.discount_type === t ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'}`}>
                      {t === 'percentage' ? '% Percentage' : '₦ Fixed amount'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Value * {form.discount_type === 'percentage' ? '(%)' : '(₦)'}</label>
                <input
                  type="number" min="0" step="any"
                  value={form.discount_value}
                  onChange={e => set('discount_value', e.target.value)}
                  placeholder={form.discount_type === 'percentage' ? '20' : '500'}
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* Applies to */}
          <Section title="Applies to">
            <div className="grid grid-cols-3 gap-3 mb-4">
              {([
                { val: 'all', label: 'All products', desc: 'Works on every item in your store', icon: 'M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z' },
                { val: 'products', label: 'Specific products', desc: 'Choose which products qualify', icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z' },
                { val: 'categories', label: 'Specific categories', desc: 'Apply to a whole category', icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z' },
              ] as { val: AppliesTo; label: string; desc: string; icon: string }[]).map(opt => (
                <button key={opt.val} type="button" onClick={() => set('applies_to', opt.val)}
                  className={`text-left p-4 rounded-xl border-2 transition-colors ${form.applies_to === opt.val ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-white/5' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                  <svg className={`w-5 h-5 mb-2 ${form.applies_to === opt.val ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} />
                  </svg>
                  <p className={`text-sm font-medium ${form.applies_to === opt.val ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{opt.label}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5 leading-snug">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Product picker */}
            {form.applies_to === 'products' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{form.product_ids.length} product{form.product_ids.length !== 1 ? 's' : ''} selected</p>
                  {form.product_ids.length > 0 && (
                    <button type="button" onClick={() => set('product_ids', [])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
                  )}
                </div>
                <div className="relative mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none" />
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredProducts.map(p => (
                    <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox" checked={form.product_ids.includes(p.id)}
                        onChange={e => set('product_ids', e.target.checked ? [...form.product_ids, p.id] : form.product_ids.filter(id => id !== p.id))}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900 shrink-0" />
                      {p.thumbnail && <img src={p.thumbnail} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />}
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{p.name}</span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && <p className="px-3 py-4 text-sm text-center text-gray-400">No products found.</p>}
                </div>
              </div>
            )}

            {/* Category picker */}
            {form.applies_to === 'categories' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{form.category_ids.length} categor{form.category_ids.length !== 1 ? 'ies' : 'y'} selected</p>
                  {form.category_ids.length > 0 && (
                    <button type="button" onClick={() => set('category_ids', [])} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
                  )}
                </div>
                <div className="relative mb-2">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories…" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none" />
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredCategories.map(c => (
                    <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox" checked={form.category_ids.includes(c.id)}
                        onChange={e => set('category_ids', e.target.checked ? [...form.category_ids, c.id] : form.category_ids.filter(id => id !== c.id))}
                        className="w-4 h-4 rounded border-gray-300 accent-gray-900 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{c.name}</span>
                    </label>
                  ))}
                  {filteredCategories.length === 0 && <p className="px-3 py-4 text-sm text-center text-gray-400">No categories found.</p>}
                </div>
              </div>
            )}
          </Section>

          {/* Restrictions */}
          <Section title="Restrictions">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Min order (₦)</label>
                <input type="number" min="0" step="any" value={form.min_order_amount} onChange={e => set('min_order_amount', e.target.value)} placeholder="5000" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1.5">Leave blank for no minimum</p>
              </div>
              <div>
                <label className={labelCls}>Max uses</label>
                <input type="number" min="1" step="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="100" className={inputCls} />
                <p className="text-xs text-gray-400 mt-1.5">Leave blank for unlimited</p>
              </div>
              <div>
                <label className={labelCls}>Expires at</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-400 mt-1.5">Leave blank — never expires</p>
              </div>
            </div>
          </Section>

          {/* Footer */}
          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${form.is_active ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 shadow transform transition-transform duration-200 ${form.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">Active — coupon is usable by customers</span>
            </label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={goBack} className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={isPending}
                className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isPending && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                {view === 'edit' ? 'Save changes' : 'Create coupon'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
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
        <button onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-xl hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create coupon
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400 flex items-start justify-between gap-3">
          <span>{deleteError}</span>
          <button type="button" onClick={() => setDeleteError('')} className="shrink-0 text-red-400 hover:text-red-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {/* Empty */}
      {coupons.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No coupons yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1 mb-4">Create a discount code to share with your customers</p>
          <button onClick={openCreate} className="text-sm text-gray-900 dark:text-white font-medium hover:underline">Create your first coupon →</button>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden sm:table-cell">Applies to</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Min order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden md:table-cell">Uses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {coupons.map(c => {
                const expiry = formatExpiry(c.expires_at)
                const appliesTo = c.applies_to ?? 'all'
                const productCount = (c.product_ids ?? []).length
                const categoryCount = (c.category_ids ?? []).length
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Code */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 dark:text-white tracking-wide">{c.code}</span>
                        {c.code === linkedCouponCode && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" title="Linked to the newsletter popup">
                            Popup
                          </span>
                        )}
                        <button type="button" onClick={() => copyCode(c.code)} className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors" title="Copy">
                          {copied === c.code ? (
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25" /></svg>
                          )}
                        </button>
                      </div>
                      {c.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate max-w-[180px]">{c.description}</p>}
                    </td>

                    {/* Discount */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {c.discount_type === 'percentage' ? `${c.discount_value}%` : `₦${fmt(c.discount_value)}`}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-600 ml-1">off</span>
                    </td>

                    {/* Applies to */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {appliesTo === 'all' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                          All products
                        </span>
                      ) : appliesTo === 'products' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                          {productCount} product{productCount !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          {categoryCount} categor{categoryCount !== 1 ? 'ies' : 'y'}
                        </span>
                      )}
                    </td>

                    {/* Min order */}
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">
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
                        <span className={`text-sm ${expiry.expired ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{expiry.label}</span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-700">Never</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleToggleActive(c.id, c.is_active)} disabled={isPending}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${c.is_active ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 hover:bg-green-100' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {c.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button type="button" onClick={() => openEdit(c)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Edit</button>
                        <button type="button" onClick={() => handleDelete(c.id, c.code)} className="text-sm text-red-400 hover:text-red-600 transition-colors">Delete</button>
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
