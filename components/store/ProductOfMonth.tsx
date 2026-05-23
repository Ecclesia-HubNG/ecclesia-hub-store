'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'

type Option  = { value: string; price?: number | null }
type Variant = { name: string; options: Option[] }

type Props = {
  product: {
    id: string
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    thumbnail: string | null
    images: string[]
    stock: number
    variants: Variant[]
    categories: { name: string } | null
    brand?: { name: string } | null
  }
}

function fmt(n: number) {
  return `₦${n.toLocaleString('en', { minimumFractionDigits: 0 })}`
}

export default function ProductOfMonth({ product }: Props) {
  const { addItem } = useCart()
  const router = useRouter()

  const images = product.images?.length ? product.images : product.thumbnail ? [product.thumbnail] : []
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [selected, setSelected] = useState<Record<string, string>>(
    () => Object.fromEntries(product.variants.map(v => [v.name, (Array.isArray(v.options) ? v.options : [])[0]?.value ?? '']))
  )
  const [added, setAdded] = useState(false)

  const resolvedPrice = (() => {
    for (const v of product.variants) {
      const opt = (Array.isArray(v.options) ? v.options : []).find(o => o.value === selected[v.name])
      if (opt?.price != null) return opt.price
    }
    return product.price
  })()

  const cartVariants = product.variants
    .filter(v => selected[v.name])
    .map(v => {
      const opt = (Array.isArray(v.options) ? v.options : []).find(o => o.value === selected[v.name])
      return { groupName: v.name, value: selected[v.name], price: opt?.price ?? 0 }
    })

  function handleAdd() {
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: resolvedPrice, thumbnail: product.thumbnail, selectedVariants: cartVariants.length > 0 ? cartVariants : undefined, quantity: qty })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  function handleBuyNow() {
    addItem({ productId: product.id, slug: product.slug, name: product.name, price: resolvedPrice, thumbnail: product.thumbnail, selectedVariants: cartVariants.length > 0 ? cartVariants : undefined, quantity: qty })
    router.push('/cart')
  }

  const outOfStock = product.stock === 0

  return (
    <section className="w-full px-3 md:px-5 pb-16">
      {/* Heading */}
      <div className="text-center mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-2">Featured</p>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Product of the Month
        </h2>
        <div className="mt-3 mx-auto w-12 h-px bg-[#4A0F1C]/30 dark:bg-[#D4849A]/30" />
      </div>

      {/* Card — full-width two-column */}
      <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 grid md:grid-cols-2">

        {/* ── Left: image ── */}
        <div className="relative bg-[#F5F3F0] dark:bg-gray-800">
          <div className="aspect-[4/3] w-full">
            {images[activeImg] ? (
              <img
                src={images[activeImg]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-20 h-20 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail strip — bottom overlay */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shadow-md ${
                    i === activeImg
                      ? 'border-white opacity-100'
                      : 'border-white/40 opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: details ── */}
        <div className="flex flex-col justify-center px-8 md:px-10 py-7">

          {/* Brand */}
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B1A2A] dark:text-[#D4849A] mb-1.5">
            {product.brand?.name ?? product.categories?.name ?? 'Ecclesia Hub'}
          </p>

          {/* Name */}
          <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-white leading-tight mb-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{fmt(resolvedPrice)}</span>
            {product.compare_at_price && product.compare_at_price > resolvedPrice && (
              <span className="text-lg text-gray-400 line-through">{fmt(product.compare_at_price)}</span>
            )}
          </div>

          {/* Stars */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-gray-400">No reviews yet</span>
          </div>

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-4 mb-6">
              {product.variants.map(v => (
                <div key={v.name}>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {v.name}: <span className="font-normal text-gray-400">{selected[v.name]}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(Array.isArray(v.options) ? v.options : []).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelected(prev => ({ ...prev, [v.name]: opt.value }))}
                        className={`px-4 py-1.5 rounded-lg text-sm border transition-all ${
                          selected[v.name] === opt.value
                            ? 'border-[#4A0F1C] bg-[#4A0F1C] text-white'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {opt.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity */}
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quantity:</p>
            <div className="inline-flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setQty(q => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </svg>
              </button>
              <span className="w-12 text-center text-sm font-bold text-gray-900 dark:text-white tabular-nums">{qty}</span>
              <button type="button" onClick={() => setQty(q => Math.min(product.stock, q + 1))} disabled={qty >= product.stock || outOfStock}
                className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleAdd}
              className={`w-full h-13 py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                added        ? 'bg-green-600 text-white'
                : outOfStock ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                :               'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
              }`}
            >
              {outOfStock ? 'Out of Stock' : added ? '✓ Added to Cart' : 'Add to Cart'}
            </button>
            <button
              type="button"
              disabled={outOfStock}
              onClick={handleBuyNow}
              className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Buy It Now
            </button>
          </div>

          <Link href={`/product/${product.slug}`} className="text-xs text-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-3 underline underline-offset-2 transition-colors">
            View full details
          </Link>
        </div>
      </div>
    </section>
  )
}
