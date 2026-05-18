'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleProductFeatured, toggleCategoryFeatured, toggleBrandFeatured } from '@/lib/actions/featured'

type Product = { id: string; name: string; slug: string; thumbnail: string | null; price: number; is_featured: boolean; is_active: boolean }
type Category = { id: string; name: string; slug: string; image: string | null; is_featured: boolean }
type Brand = { id: string; name: string; slug: string; logo: string | null; is_featured: boolean }


function Thumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
        </svg>
      )}
    </div>
  )
}

type Tab = 'products' | 'categories' | 'brands'

export default function FeaturedManager({
  initialProducts,
  initialCategories,
  initialBrands,
}: {
  initialProducts: Product[]
  initialCategories: Category[]
  initialBrands: Brand[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState<Tab>('products')

  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [brands, setBrands] = useState(initialBrands)

  // Picker state
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const toggle = (type: Tab, id: string, current: boolean) => {
    const next = !current
    if (type === 'products') setProducts(p => p.map(x => x.id === id ? { ...x, is_featured: next } : x))
    if (type === 'categories') setCategories(p => p.map(x => x.id === id ? { ...x, is_featured: next } : x))
    if (type === 'brands') setBrands(p => p.map(x => x.id === id ? { ...x, is_featured: next } : x))
    setPendingIds(s => new Set(s).add(id))
    startTransition(async () => {
      if (type === 'products') await toggleProductFeatured(id, next)
      if (type === 'categories') await toggleCategoryFeatured(id, next)
      if (type === 'brands') await toggleBrandFeatured(id, next)
      setPendingIds(s => { const n = new Set(s); n.delete(id); return n })
      router.refresh()
    })
  }

  const featuredProducts = products.filter(p => p.is_featured)
  const featuredCategories = categories.filter(c => c.is_featured)
  const featuredBrands = brands.filter(b => b.is_featured)

  const tabs: { id: Tab; label: string; featured: number }[] = [
    { id: 'products', label: 'Products', featured: featuredProducts.length },
    { id: 'categories', label: 'Categories', featured: featuredCategories.length },
    { id: 'brands', label: 'Brands', featured: featuredBrands.length },
  ]

  const pickerItems = useMemo(() => {
    const q = pickerSearch.toLowerCase()
    if (tab === 'products') return products.filter(p => !p.is_featured && (!q || p.name.toLowerCase().includes(q)))
    if (tab === 'categories') return categories.filter(c => !c.is_featured && (!q || c.name.toLowerCase().includes(q)))
    return brands.filter(b => !b.is_featured && (!q || b.name.toLowerCase().includes(q)))
  }, [tab, products, categories, brands, pickerSearch])

  const currentFeatured = tab === 'products' ? featuredProducts : tab === 'categories' ? featuredCategories : featuredBrands
  const editHref = (id: string) => tab === 'products' ? `/admin/products/${id}/edit` : tab === 'categories' ? `/admin/categories/${id}/edit` : `/admin/brands/${id}/edit`
  const emptyHref = tab === 'products' ? '/admin/products' : tab === 'categories' ? '/admin/categories/new' : '/admin/brands/new'
  const emptyLabel = tab === 'products' ? 'Go to Products to feature some →' : tab === 'categories' ? 'Add a category →' : 'Add a brand →'

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} className={`cursor-pointer rounded-xl border p-4 transition-colors ${tab === t.id ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'}`}>
            <p className={`text-2xl font-bold ${tab === t.id ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>{t.featured}</p>
            <p className={`text-xs mt-0.5 ${tab === t.id ? 'text-white/70 dark:text-gray-900/70' : 'text-gray-500 dark:text-gray-400'}`}>Featured {t.label}</p>
          </div>
        ))}
      </div>

      {/* Tab nav + Add button */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t.id} type="button" onClick={() => { setTab(t.id); setShowPicker(false); setPickerSearch('') }}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {t.label}
              {t.featured > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tab === t.id ? 'bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900' : 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'}`}>
                  {t.featured}
                </span>
              )}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setShowPicker(p => !p); setPickerSearch('') }}
          className="mb-1 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add to featured
        </button>
      </div>

      {/* Picker panel */}
      {showPicker && (
        <div className="mb-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <input
              autoFocus
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              placeholder={`Search non-featured ${tab}…`}
              className="w-full text-sm bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
            />
          </div>
          {pickerItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-gray-400 dark:text-gray-600">
              {pickerSearch ? 'No matches.' : `All ${tab} are already featured.`}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
              {pickerItems.map((item: any) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                  <Thumb src={item.thumbnail ?? item.image ?? item.logo ?? null} alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                    {item.price != null && <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">₦{item.price.toLocaleString()}</p>}
                  </div>
                  <button
                    type="button"
                    disabled={pendingIds.has(item.id)}
                    onClick={() => toggle(tab, item.id, false)}
                    className="shrink-0 text-xs font-medium px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    {pendingIds.has(item.id) ? 'Adding…' : 'Feature'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Featured list — only featured items */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {currentFeatured.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-400 dark:text-gray-600">No featured {tab} yet.</p>
            <Link href={emptyHref} className="text-sm text-gray-900 dark:text-white font-medium mt-1 inline-block hover:underline">{emptyLabel}</Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {(currentFeatured as any[]).map(item => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                <Thumb src={item.thumbnail ?? item.image ?? item.logo ?? null} alt={item.name} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {item.price != null ? `₦${item.price.toLocaleString()}` : item.slug ? `/${item.slug}` : ''}
                    {item.is_active === false && <span className="ml-2 text-amber-500 dark:text-amber-400">Inactive</span>}
                  </p>
                </div>
                <Link href={editHref(item.id)} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0">Edit</Link>
                <button
                  type="button"
                  disabled={pendingIds.has(item.id)}
                  onClick={() => toggle(tab, item.id, true)}
                  className="shrink-0 text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {pendingIds.has(item.id) ? '…' : 'Remove'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
