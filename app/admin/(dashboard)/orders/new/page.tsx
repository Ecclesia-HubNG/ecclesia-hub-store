import { createAdminClient } from '@/lib/supabase/admin'
import NewOrderForm from '@/components/admin/NewOrderForm'
import Link from 'next/link'

export default async function NewOrderPage() {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, thumbnail, stock')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="p-8 max-w-3xl">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to orders
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">New manual order</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Enter an offline or social media order</p>
      </div>

      <NewOrderForm products={products ?? []} />
    </div>
  )
}
