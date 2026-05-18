export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'
import HeroSection from '@/components/store/HeroSection'
import BrandTicker from '@/components/store/BrandTicker'
import CategoryShowcase from '@/components/store/CategoryShowcase'

export default async function HomePage() {
  const supabase = createClient()
  const admin = createAdminClient()

  const [{ data: featured }, { data: heroWidget }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(4),
    admin
      .from('homepage_widgets')
      .select('config')
      .eq('type', 'hero')
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('categories')
      .select('id, name, slug, image')
      .order('name'),
  ])

  const widgetConfig = heroWidget?.config as { hero_image?: string; product_id?: string; category_id?: string } | null

  // Resolve hero product — fetch directly by ID if not in the featured list
  let heroProductRaw: (typeof featured extends (infer T)[] | null ? T : never) | null = null
  if (widgetConfig?.product_id) {
    const inFeatured = featured?.find(p => p.id === widgetConfig.product_id)
    if (inFeatured) {
      heroProductRaw = inFeatured
    } else {
      const { data: specific } = await supabase
        .from('products')
        .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
        .eq('id', widgetConfig.product_id)
        .eq('is_active', true)
        .maybeSingle()
      heroProductRaw = specific ?? featured?.[0] ?? null
    }
  } else {
    heroProductRaw = featured?.[0] ?? null
  }

  // Hero background: explicit upload first, then the selected product thumbnail, then nothing
  const heroImage = widgetConfig?.hero_image ?? heroProductRaw?.thumbnail ?? null

  const featuredProduct = heroProductRaw ? {
    ...heroProductRaw,
    categories: Array.isArray(heroProductRaw.categories)
      ? (heroProductRaw.categories[0] ?? null)
      : heroProductRaw.categories,
  } : null

  return (
    <div>
      <HeroSection heroImage={heroImage} featuredProduct={featuredProduct} />
      <BrandTicker />

      <CategoryShowcase categories={categories ?? []} />

      {!!featured?.length && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-sm text-gray-400 mt-0.5">Handpicked favourites</p>
            </div>
            <Link href="/shop" className="text-sm font-medium text-[#4A0F1C] hover:text-[#3A0B15] transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {featured.map(product => (
              <ProductCard
                key={product.id}
                product={product as typeof product & { categories: { name: string } | null }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        <div className="bg-[#4A0F1C] rounded-3xl px-8 md:px-14 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#D4849A] mb-2">Faith. Word. Life.</p>
            <h3 className="text-xl md:text-2xl font-bold text-white">Browse the full collection</h3>
            <p className="text-sm text-white/60 mt-1.5 max-w-md">
              Body care and skincare crafted for those who live with intention.
            </p>
          </div>
          <Link
            href="/shop"
            className="shrink-0 px-7 py-3 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm"
          >
            Shop Now →
          </Link>
        </div>
      </section>
    </div>
  )
}
