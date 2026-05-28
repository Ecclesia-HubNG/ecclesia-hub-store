import { createAdminClient } from '@/lib/supabase/admin'
import { RestoreOrderButton } from '@/components/admin/RestoreOrderButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function DeletedOrdersPage() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, items, shipping_address, created_at, deleted_at, deleted_by_role, deleted_by_email, payment_reference, order_channel')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })

  const list = orders ?? []

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Link href="/admin/orders" className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            Orders
          </Link>
          <span className="text-gray-300 dark:text-gray-700">/</span>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Deleted Orders</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Orders cancelled by customers or removed by admins. You can restore any order.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-16 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-600">No deleted orders.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">Order</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">Customer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">Items</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">Cancelled by</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600">Cancelled at</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {list.map(order => {
                const shipping = order.shipping_address as Record<string, string> | null
                const customerName = shipping
                  ? [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || shipping.name || '—'
                  : '—'
                const customerEmail = shipping?.email ?? '—'
                const items = Array.isArray(order.items) ? order.items : []
                const itemSummary = items.slice(0, 2).map((i: any) => i.name).join(', ') + (items.length > 2 ? ` +${items.length - 2} more` : '')

                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs font-semibold text-gray-900 dark:text-white">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{order.status?.replace(/_/g, ' ')}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900 dark:text-white">{customerName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{customerEmail}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700 dark:text-gray-300 text-xs max-w-[200px] truncate">{itemSummary || '—'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-900 dark:text-white">{fmt(Number(order.total))}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        order.deleted_by_role === 'customer'
                          ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                          : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                      }`}>
                        {order.deleted_by_role === 'customer' ? 'Customer' : 'Admin'}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5 max-w-[160px] truncate">{order.deleted_by_email ?? '—'}</p>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {order.deleted_at
                        ? new Date(order.deleted_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {order.deleted_at
                          ? new Date(order.deleted_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <RestoreOrderButton id={order.id} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
