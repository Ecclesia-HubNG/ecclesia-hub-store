import { createAdminClient } from '@/lib/supabase/admin'
import FeaturedManager from '@/components/admin/FeaturedManager'

export default async function FeaturedPage() {
  const supabase = createAdminClient()

  const [{ data: products }, { data: categories }, { data: brands }] = await Promise.all([
    supabase.from('products').select('id, name, slug, thumbnail, price, is_featured, is_active').order('name'),
    supabase.from('categories').select('id, name, slug, image, is_featured').order('name'),
    supabase.from('brands').select('id, name, slug, logo, is_featured').order('name'),
  ])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Featured</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Control which products, categories, and brands are highlighted in your store.</p>
      </div>
      <FeaturedManager
        initialProducts={products ?? []}
        initialCategories={categories ?? []}
        initialBrands={brands ?? []}
      />
    </div>
  )
}
