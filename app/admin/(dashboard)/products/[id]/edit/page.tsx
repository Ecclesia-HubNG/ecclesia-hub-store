import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateProduct } from '@/lib/actions/products'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).single(),
    supabase.from('categories').select('id, name').order('name'),
  ])

  if (!product) notFound()

  const boundAction = updateProduct.bind(null, product.id)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Products
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">Edit product</h1>
      </div>
      <ProductForm
        action={boundAction}
        product={product}
        categories={categories ?? []}
        submitLabel="Update product"
      />
    </div>
  )
}
