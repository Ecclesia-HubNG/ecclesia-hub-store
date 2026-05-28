import { createAdminClient } from '@/lib/supabase/admin'
import NewOrderForm from '@/components/admin/NewOrderForm'
import Link from 'next/link'

export default async function NewOrderPage() {
  const supabase = createAdminClient()

  const [{ data: products }, { data: types }, { data: zones }, { data: rates }] = await Promise.all([
    supabase.from('products').select('id, name, price, thumbnail, stock').eq('is_active', true).order('name'),
    supabase.from('delivery_types').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('delivery_zones').select('id, type_id, name').eq('is_active', true).order('sort_order'),
    supabase.from('delivery_rates').select('id, zone_id, name, price, estimated_days').eq('is_active', true).order('sort_order'),
  ])

  // Flatten to a list of selectable options
  const deliveryRates = (rates ?? []).map(r => {
    const zone = (zones ?? []).find(z => z.id === r.zone_id)
    const type = zone ? (types ?? []).find(t => t.id === zone.type_id) : null
    const label = [type?.name, zone?.name, r.name].filter(Boolean).join(' · ')
    return { id: r.id, label, price: r.price as number, estimated_days: r.estimated_days as string | null }
  })

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

      <NewOrderForm products={products ?? []} deliveryRates={deliveryRates} />
    </div>
  )
}
