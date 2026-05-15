import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateBrand } from '@/lib/actions/brands'
import BrandForm from '@/components/admin/BrandForm'

export default async function EditBrandPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()
  const { data: brand } = await supabase
    .from('brands')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!brand) notFound()

  const boundAction = updateBrand.bind(null, brand.id)

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/brands" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          ← Brands
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mt-2">{brand.name}</h1>
      </div>
      <BrandForm action={boundAction} brand={brand} submitLabel="Save changes" />
    </div>
  )
}
