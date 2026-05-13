import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { createProduct } from '@/lib/actions/products'
import ProductForm from '@/components/admin/ProductForm'

export default async function NewProductPage() {
  const supabase = createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">New product</h1>
      </div>
      <ProductForm
        action={createProduct}
        categories={categories ?? []}
        submitLabel="Create product"
      />
    </div>
  )
}
