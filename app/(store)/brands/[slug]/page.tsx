export const revalidate = 60

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProductCard from '@/components/store/ProductCard'

export const dynamic = 'force-dynamic'

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const [{ data: brand }, { data: products }] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name, slug, description, logo, website')
      .eq('slug', params.slug)
      .single(),
    supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, thumbnail, stock, variants, categories(name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  if (!brand) notFound()

  // Filter by brand_id client-side (brand_id is on products but not in the select above — re-fetch)
  const { data: brandProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, compare_at_price, thumbnail, stock, variants, categories(name)')
    .eq('brand_id', brand.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div>
      {/* Brand hero */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-12">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {brand.logo && (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center p-3 shrink-0">
              <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <Link href="/shop" className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                Shop
              </Link>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">{brand.name}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{brand.name}</h1>
            {brand.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl leading-relaxed">
                {brand.description}
              </p>
            )}
            {brand.website && (
              <a
                href={brand.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-[#4A0F1C] dark:text-[#D4849A] hover:underline mt-3 font-medium"
              >
                {brand.website.replace(/^https?:\/\//, '')}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            )}
          </div>
          <div className="shrink-0">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {brandProducts?.length ?? 0} product{brandProducts?.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800" />

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {!brandProducts?.length ? (
          <div className="text-center py-24">
            <p className="text-gray-400 dark:text-gray-600 text-sm">No products available for this brand yet.</p>
            <Link href="/shop" className="text-sm font-medium text-[#4A0F1C] dark:text-[#D4849A] hover:underline mt-3 inline-block">
              Browse all products →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {brandProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product as any}
                showCategory
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
