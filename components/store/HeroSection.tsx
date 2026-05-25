'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

export type HeroSlide = {
  id: string
  image?: string | null
  heading?: string | null
  subheading?: string | null
  cta_label?: string | null
  cta_href?: string | null
}

type FeaturedProduct = {
  name: string
  slug: string
  price: number
  thumbnail: string | null
  categories: { name: string } | null
}

const DEFAULT_HEADING = 'Skin that speaks\nbefore you\neven do.'
const DEFAULT_SUB = 'Premium body care and skincare crafted for the radiant, unapologetically luminous you.'

export default function HeroSection({
  slides,
  featuredProduct,
}: {
  slides: HeroSlide[]
  featuredProduct?: FeaturedProduct | null
}) {
  const count = slides.length
  const [current, setCurrent] = useState(0)

  const goTo = useCallback((idx: number) => setCurrent((idx + count) % count), [count])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  useEffect(() => {
    if (count <= 1) return
    const t = setInterval(() => setCurrent(c => (c + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count])

  const slide = slides[current] ?? {}
  const heading = slide.heading || DEFAULT_HEADING
  const subheading = slide.subheading || DEFAULT_SUB
  const ctaLabel = slide.cta_label || 'Shop Now'
  const ctaHref = slide.cta_href || '/shop'

  return (
    <section className="w-full px-3 md:px-5 pt-4 pb-8">
      <div className="relative overflow-hidden rounded-3xl min-h-[520px] md:min-h-[720px]">

        {/* ── Slide backgrounds ── */}
        {slides.length === 0 ? (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(145deg, #120307 0%, #3A0B15 35%, #6B1A2A 65%, #A8545F 88%, #D4849A 100%)' }}
          />
        ) : slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100 z-0' : 'opacity-0 -z-10'}`}
          >
            {s.image ? (
              <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(145deg, #120307 0%, #3A0B15 35%, #6B1A2A 65%, #A8545F 88%, #D4849A 100%)' }}
              />
            )}
          </div>
        ))}

        {/* Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent z-10" />

        {/* ── Content ── */}
        <div className="relative z-20 flex flex-col justify-between p-7 md:p-10 min-h-[520px] md:min-h-[720px]">

          {/* TOP ROW */}
          <div className="flex items-start justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white">New Collection</span>
            </div>

            {featuredProduct && (
              <div className="hidden md:block w-52 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 shrink-0">
                <div className="flex gap-1.5 flex-wrap mb-3">
                  {featuredProduct.categories?.name && (
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-wide text-white">
                      {featuredProduct.categories.name}
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-bold uppercase tracking-wide text-white">New</span>
                </div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="text-sm font-bold text-white leading-snug line-clamp-2 flex-1">{featuredProduct.name}</p>
                  <Link
                    href={`/product/${featuredProduct.slug}`}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </Link>
                </div>
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/10">
                  {featuredProduct.thumbnail ? (
                    <img src={featuredProduct.thumbnail} alt={featuredProduct.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-30">
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* BOTTOM ROW */}
          <div>
            <div className="flex items-end justify-between gap-6 flex-wrap md:flex-nowrap mb-6">
              <div>
                <h1 className="text-[2.5rem] md:text-[3.2rem] lg:text-[4rem] font-bold text-white leading-[1.05] tracking-tight mb-4">
                  {heading.split('\n').map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </h1>
                <p className="text-sm md:text-base text-white/65 mb-6 max-w-sm leading-relaxed">
                  {subheading}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Link href={ctaHref} className="px-7 py-3 bg-white text-gray-900 text-sm font-bold rounded-full hover:bg-gray-100 transition-colors">
                    {ctaLabel}
                  </Link>
                  <Link href="/shop" className="px-7 py-3 bg-white/15 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold rounded-full hover:bg-white/25 transition-colors">
                    Explore More
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-2xl flex items-center gap-3 px-4 py-3.5 w-full md:w-auto md:max-w-[260px] shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {featuredProduct?.thumbnail ? (
                    <img src={featuredProduct.thumbnail} alt={featuredProduct.name} className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-[#4A0F1C] uppercase tracking-wide">
                    {featuredProduct?.categories?.name ?? 'Body Care'}
                  </p>
                  <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-1 mt-0.5">
                    {featuredProduct?.name ?? 'Premium Body Care'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {featuredProduct ? `₦${featuredProduct.price.toLocaleString('en')}` : 'Shop the full range'}
                  </p>
                </div>
                <Link
                  href={featuredProduct ? `/product/${featuredProduct.slug}` : '/shop'}
                  className="w-8 h-8 rounded-full bg-[#4A0F1C] hover:bg-[#3A0B15] flex items-center justify-center shrink-0 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Dots + arrows */}
            {count > 1 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === current ? 'bg-white w-8' : 'bg-white/40 w-1.5 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prev}
                    aria-label="Previous slide"
                    className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={next}
                    aria-label="Next slide"
                    className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
