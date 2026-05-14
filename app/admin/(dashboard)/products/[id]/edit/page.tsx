import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { updateProduct } from '@/lib/actions/products'
import ProductForm from '@/components/admin/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const [{ data: product }, { data: categories }, { data: allProducts }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.id).single(),
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('products').select('id, name, thumbnail').neq('id', params.id).order('name'),
  ])

  if (!product) notFound()

  const boundAction = updateProduct.bind(null, product.id)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Products
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">{product.name}</h1>
        </div>

        {product.is_active && (
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View live
          </Link>
        )}
      </div>

      <ProductForm
        action={boundAction}
        product={product}
        categories={categories ?? []}
        allProducts={allProducts ?? []}
        submitLabel="Save changes"
      />

    </div>
  )
}
