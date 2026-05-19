export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import HeroSection from '@/components/store/HeroSection'
import BrandTicker from '@/components/store/BrandTicker'
import CategoryShowcase from '@/components/store/CategoryShowcase'
import FeaturedProducts from '@/components/store/FeaturedProducts'
import ProductOfMonth from '@/components/store/ProductOfMonth'

export default async function HomePage() {
  const supabase = createClient()
  const admin = createAdminClient()

  const [{ data: featured }, { data: heroWidget }, { data: categories }, { data: potmRaw }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, categories(name)')
      .eq('is_featured', true)
      .eq('is_active', true)
      .limit(8),
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
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, images, stock, variants, categories(name), brands(name)')
      .eq('is_product_of_month', true)
      .eq('is_active', true)
      .maybeSingle(),
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

      <FeaturedProducts products={(featured ?? []) as any} />

      {potmRaw && (
        <ProductOfMonth product={{
          ...potmRaw,
          images: (potmRaw.images ?? []) as string[],
          variants: (potmRaw.variants ?? []) as any,
          categories: Array.isArray(potmRaw.categories) ? (potmRaw.categories[0] ?? null) : potmRaw.categories,
          brand: Array.isArray((potmRaw as any).brands) ? ((potmRaw as any).brands[0] ?? null) : (potmRaw as any).brands,
        }} />
      )}

      <section className="w-full px-3 md:px-5 pb-16">
        <div className="relative bg-[#4A0F1C] rounded-3xl px-8 md:px-14 py-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">

          {/* ── background layers ── */}
          <div className="absolute inset-0 pointer-events-none select-none">
            {/* blurred colour blobs */}
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#7B2234]/50 blur-3xl" />
            <div className="absolute right-1/3 -bottom-12 w-56 h-56 rounded-full bg-[#2A0810]/70 blur-2xl" />
            <div className="absolute left-0 bottom-0 w-48 h-48 rounded-full bg-[#3A0B15]/60 blur-2xl" />
            {/* subtle dot grid */}
            <div
              className="absolute inset-0 opacity-[0.045]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            />
            {/* concentric decorative rings */}
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-white/[0.07]" />
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white/[0.04]" />
            <div className="absolute -right-10 top-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full border border-white/[0.025]" />
          </div>

          {/* ── content ── */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-5 h-px bg-[#D4849A]/70" />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4849A]">Glow. Nourish. Thrive.</p>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">Browse the full collection</h3>
            <p className="text-sm text-white/60 mt-1.5 max-w-md">
              Body care and skincare crafted for those who live with intention.
            </p>
          </div>

          {/* ── CTA ── */}
          <Link
            href="/shop"
            className="relative z-10 shrink-0 px-7 py-3 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-50 transition-colors shadow-sm"
          >
            Shop Now →
          </Link>
        </div>
      </section>
    </div>
  )
}
