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
    .select('id, name, logo')
    .order('name')

  const hasLogos = dbBrands?.some(b => b.logo)

  // Use DB brands if any exist, otherwise fall back to static names
  const items: { id: string; name: string; logo?: string | null }[] =
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
    <div className="w-full px-3 md:px-5 py-3">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white py-5">
        <div className="flex items-center gap-10 ticker-track" style={{ animationDuration: `${duration}s` }}>
          {doubled.map((brand, i) => (
            <span key={`${brand.id}-${i}`} className="flex items-center gap-10 shrink-0">
              {hasLogos && brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-6 w-auto object-contain opacity-50 hover:opacity-80 transition-opacity grayscale"
                />
              ) : (
                <span className="text-sm font-semibold tracking-[0.1em] uppercase text-gray-400 hover:text-gray-700 transition-colors cursor-default whitespace-nowrap">
                  {brand.name}
                </span>
              )}
              <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
