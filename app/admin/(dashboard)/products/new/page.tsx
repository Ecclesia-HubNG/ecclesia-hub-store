import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { createProduct } from '@/lib/actions/products'
import ProductForm from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const supabase = createAdminClient()
  const [{ data: categories }, { data: brands }, { data: allProducts }] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('products').select('id, name, thumbnail').order('name'),
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">New product</h1>
      </div>
      <ProductForm
        action={createProduct}
        categories={categories ?? []}
        brands={brands ?? []}
        allProducts={allProducts ?? []}
        submitLabel="Create product"
      />
    </div>
  )
}
