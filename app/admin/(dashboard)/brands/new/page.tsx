import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { createBrand } from '@/lib/actions/brands'
import BrandForm from '@/components/admin/BrandForm'

export default async function NewBrandPage() {
  const supabase = createAdminClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, description, logo, website, is_featured')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/brands" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          ← Brands
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">New brand</h1>
      </div>
      <BrandForm
        action={createBrand}
        submitLabel="Create brand"
        brands={brands ?? []}
      />
    </div>
  )
}
