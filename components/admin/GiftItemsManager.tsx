'use client'

import { useState, useTransition, useMemo } from 'react'
import { setGiftCategory } from '@/lib/actions/categories'
import { setBestseller } from '@/lib/actions/products'

type Category = { id: string; name: string; slug: string; image: string | null; is_gift: boolean }
type Product   = { id: string; name: string; thumbnail: string | null; price: number; is_gift: boolean }

type Tab = 'products' | 'categories'
type View = 'added' | 'all'

function Thumb({ src, alt, square }: { src: string | null; alt: string; square?: boolean }) {
  return (
    <div className={`w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden flex items-center justify-center`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          {square
            ? <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3ZM6 6h.008v.008H6V6Z" />
            : <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
          }
        </svg>
      )}
    </div>
  )
}

async function setProductGift(id: string, value: boolean) {
  // Reuse the setBestseller pattern but for is_gift
  const { default: action } = await import('@/lib/actions/products').then(m => ({ default: m.setGiftProduct }))
  return action(id, value)
}

export default function GiftItemsManager({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[]
  initialCategories: Category[]
}) {
  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('products')
  const [view, setView] = useState<View>('added')

  const giftProducts    = useMemo(() => products.filter(p => p.is_gift), [products])
  const giftCategories  = useMemo(() => categories.filter(c => c.is_gift), [categories])
  const totalGift       = giftProducts.length + giftCategories.length

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (tab === 'products') {
      const pool = q ? products : (view === 'added' ? giftProducts : products)
      return q ? pool.filter(p => p.name.toLowerCase().includes(q)) : pool
    } else {
      const pool = q ? categories : (view === 'added' ? giftCategories : categories)
      return q ? pool.filter(c => c.name.toLowerCase().includes(q)) : pool
    }
  }, [products, categories, giftProducts, giftCategories, search, tab, view])

  function toggleProduct(id: string, current: boolean) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, is_gift: !current } : p))
    setPendingIds(s => new Set(s).add(id))
    startTransition(async () => {
      const { setGiftProduct } = await import('@/lib/actions/products')
      await setGiftProduct(id, !current)
      setPendingIds(s => { const n = new Set(s); n.delete(id); return n })
    })
  }

  function toggleCategory(id: string, current: boolean) {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, is_gift: !current } : c))
    setPendingIds(s => new Set(s).add(id))
    startTransition(async () => {
      await setGiftCategory(id, !current)
      setPendingIds(s => { const n = new Set(s); n.delete(id); return n })
    })
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'products',   label: 'Products',   count: products.length },
    { id: 'categories', label: 'Categories', count: categories.length },
  ]

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="flex items-center gap-4 px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{giftProducts.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gift Products</p>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{giftCategories.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gift Categories</p>
        </div>
        <div className="ml-auto text-xs text-gray-400 dark:text-gray-500 max-w-xs text-right leading-relaxed">
          Tagged products + all products in tagged categories appear on the Gift Items page.
        </div>
      </div>

      {/* Type tabs + Added/All toggle + search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Type (Products / Categories) */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm shrink-0">
          {tabs.map((t, idx) => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setTab(t.id); setSearch('') }}
              className={`px-4 py-2 font-medium transition-colors ${idx > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''} ${tab === t.id ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Added / All */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm shrink-0">
          {(['added', 'all'] as View[]).map((v, idx) => (
            <button
              key={v}
              type="button"
              onClick={() => { setView(v); setSearch('') }}
              className={`px-3 py-2 font-medium transition-colors ${idx > 0 ? 'border-l border-gray-200 dark:border-gray-700' : ''} ${view === v ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            >
              {v === 'added'
                ? `Added (${tab === 'products' ? giftProducts.length : giftCategories.length})`
                : `All (${tab === 'products' ? products.length : categories.length})`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder={`Search ${tab}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/20"
          />
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-gray-400">
            {search
              ? `No ${tab} match your search.`
              : view === 'added'
              ? `No gift ${tab} yet — switch to "All" to add some.`
              : `No ${tab} found.`}
          </div>
        ) : tab === 'products' ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(filtered as Product[]).map(product => {
              const isPending = pendingIds.has(product.id)
              return (
                <div key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <Thumb src={product.thumbnail} alt={product.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">₦{product.price.toLocaleString()}</p>
                  </div>
                  {product.is_gift && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-full shrink-0">GIFT</span>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleProduct(product.id, product.is_gift)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${product.is_gift ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30' : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {isPending ? '…' : product.is_gift ? 'Remove' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {(filtered as Category[]).map(cat => {
              const isPending = pendingIds.has(cat.id)
              return (
                <div key={cat.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <Thumb src={cat.image} alt={cat.name} square />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{cat.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">/{cat.slug}</p>
                  </div>
                  {cat.is_gift && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 rounded-full shrink-0">GIFT</span>
                  )}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => toggleCategory(cat.id, cat.is_gift)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-50 ${cat.is_gift ? 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30' : 'text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    {isPending ? '…' : cat.is_gift ? 'Remove' : 'Add'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
