import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const FALLBACK_BRANDS = [
  'Nivea', 'Olay', 'Aveeno', 'Vaseline',
  'Creme', 'Cussons', 'Saltair', 'Advanced Clinical',
  'Neutrogena', 'CeraVe', 'Dove', "Palmer's",
]

export default async function BrandTicker() {
  const supabase = createClient()
  const { data: dbBrands } = await supabase
    .from('brands')
    .select('id, name, slug, logo')
    .order('name')

  const hasLogos = dbBrands?.some(b => b.logo)

  // Use DB brands if any exist, otherwise fall back to static names
  const items: { id: string; name: string; slug?: string; logo?: string | null }[] =
    dbBrands?.length
      ? dbBrands
      : FALLBACK_BRANDS.map((name, i) => ({ id: String(i), name }))

  // Repeat enough that one half fills any realistic screen (target ≥ 30 items)
  const copies = Math.max(6, Math.ceil(30 / items.length))
  const repeated = Array.from({ length: copies }, () => items).flat()
  const doubled = [...repeated, ...repeated]
  // ~2 s per item gives comfortable reading speed regardless of list size
  const duration = repeated.length * 2

  return (
    <div className="w-full px-3 md:px-5 pb-3">
      <div className="overflow-hidden rounded-2xl py-10 bg-[#4A0F1C] dark:bg-white">
        <div className="flex items-center gap-10 ticker-track" style={{ animationDuration: `${duration}s` }}>
          {doubled.map((brand, i) => (
            <span key={`${brand.id}-${i}`} className="flex items-center gap-10 shrink-0">
              {hasLogos && brand.logo ? (
                <Link href={brand.slug ? `/brands/${brand.slug}` : '/shop'}>
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="h-6 w-auto object-contain opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
                  />
                </Link>
              ) : brand.slug ? (
                <Link
                  href={`/brands/${brand.slug}`}
                  className="text-sm font-semibold tracking-[0.1em] uppercase text-white/70 dark:text-[#4A0F1C]/60 hover:text-white dark:hover:text-[#4A0F1C] underline-offset-4 hover:underline whitespace-nowrap transition-colors"
                >
                  {brand.name}
                </Link>
              ) : (
                <span className="text-sm font-semibold tracking-[0.1em] uppercase text-white/70 dark:text-[#4A0F1C]/60 whitespace-nowrap">
                  {brand.name}
                </span>
              )}
              <span className="w-1 h-1 rounded-full bg-white/40 dark:bg-[#4A0F1C]/30 shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
