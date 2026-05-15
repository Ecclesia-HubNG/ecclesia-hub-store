'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toggleProductFeatured, toggleCategoryFeatured, toggleBrandFeatured } from '@/lib/actions/featured'

type Product = { id: string; name: string; slug: string; thumbnail: string | null; price: number; is_featured: boolean; is_active: boolean }
type Category = { id: string; name: string; slug: string; image: string | null; is_featured: boolean }
type Brand = { id: string; name: string; slug: string; logo: string | null; is_featured: boolean }

function Toggle({ on, onChange, pending }: { on: boolean; onChange: () => void; pending: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-60 ${on ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 shadow transform transition-transform duration-200 ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}

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
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('products')

  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [brands, setBrands] = useState(initialBrands)

  const toggle = (type: Tab, id: string, current: boolean) => {
    const next = !current
    // Optimistic update
    if (type === 'products') setProducts(p => p.map(x => x.id === id ? { ...x, is_featured: next } : x))
    if (type === 'categories') setCategories(p => p.map(x => x.id === id ? { ...x, is_featured: next } : x))
    if (type === 'brands') setBrands(p => p.map(x => x.id === id ? { ...x, is_featured: next } : x))

    startTransition(async () => {
      if (type === 'products') await toggleProductFeatured(id, next)
      if (type === 'categories') await toggleCategoryFeatured(id, next)
      if (type === 'brands') await toggleBrandFeatured(id, next)
      router.refresh()
    })
  }

  const featuredProducts = products.filter(p => p.is_featured).length
  const featuredCategories = categories.filter(c => c.is_featured).length
  const featuredBrands = brands.filter(b => b.is_featured).length

  const tabs: { id: Tab; label: string; count: number; featured: number }[] = [
    { id: 'products', label: 'Products', count: products.length, featured: featuredProducts },
    { id: 'categories', label: 'Categories', count: categories.length, featured: featuredCategories },
    { id: 'brands', label: 'Brands', count: brands.length, featured: featuredBrands },
  ]

  // Sort: featured first
  const sortedProducts = [...products].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
  const sortedCategories = [...categories].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
  const sortedBrands = [...brands].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} className={`cursor-pointer rounded-xl border p-4 transition-colors ${tab === t.id ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'}`}>
            <p className={`text-2xl font-bold ${tab === t.id ? 'text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}`}>{t.featured}</p>
            <p className={`text-xs mt-0.5 ${tab === t.id ? 'text-white/70 dark:text-gray-900/70' : 'text-gray-500 dark:text-gray-400'}`}>Featured {t.label}</p>
            <p className={`text-xs mt-1 ${tab === t.id ? 'text-white/50 dark:text-gray-900/50' : 'text-gray-400 dark:text-gray-600'}`}>{t.count} total</p>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-800">
        {tabs.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)}
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

      {/* Products tab */}
      {tab === 'products' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {sortedProducts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-600">No products yet.</p>
              <Link href="/admin/products/new" className="text-sm text-gray-900 dark:text-white font-medium mt-1 inline-block hover:underline">Add a product →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedProducts.map(p => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <Thumb src={p.thumbnail} alt={p.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      ₦{p.price.toLocaleString()}
                      {!p.is_active && <span className="ml-2 text-amber-500 dark:text-amber-400">Inactive</span>}
                    </p>
                  </div>
                  <Link href={`/admin/products/${p.id}/edit`} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0">Edit</Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs w-20 text-right ${p.is_featured ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                      {p.is_featured ? 'Featured' : 'Not featured'}
                    </span>
                    <Toggle on={p.is_featured} onChange={() => toggle('products', p.id, p.is_featured)} pending={isPending} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Categories tab */}
      {tab === 'categories' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {sortedCategories.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-600">No categories yet.</p>
              <Link href="/admin/categories/new" className="text-sm text-gray-900 dark:text-white font-medium mt-1 inline-block hover:underline">Add a category →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedCategories.map(c => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <Thumb src={c.image} alt={c.name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">/{c.slug}</p>
                  </div>
                  <Link href={`/admin/categories/${c.id}/edit`} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0">Edit</Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs w-20 text-right ${c.is_featured ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                      {c.is_featured ? 'Featured' : 'Not featured'}
                    </span>
                    <Toggle on={c.is_featured} onChange={() => toggle('categories', c.id, c.is_featured)} pending={isPending} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Brands tab */}
      {tab === 'brands' && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {sortedBrands.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-600">No brands yet.</p>
              <Link href="/admin/brands/new" className="text-sm text-gray-900 dark:text-white font-medium mt-1 inline-block hover:underline">Add a brand →</Link>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedBrands.map(b => (
                <li key={b.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden flex items-center justify-center">
                    {b.logo ? <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1" /> : (
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">/{b.slug}</p>
                  </div>
                  <Link href={`/admin/brands/${b.id}/edit`} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors shrink-0">Edit</Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs w-20 text-right ${b.is_featured ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-400 dark:text-gray-600'}`}>
                      {b.is_featured ? 'Featured' : 'Not featured'}
                    </span>
                    <Toggle on={b.is_featured} onChange={() => toggle('brands', b.id, b.is_featured)} pending={isPending} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
