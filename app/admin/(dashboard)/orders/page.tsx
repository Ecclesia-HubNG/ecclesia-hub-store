import { createClient } from '@/lib/supabase/server'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'

export default async function AdminOrdersPage() {
  const supabase = createClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('*, customers(full_name, email)')
    .order('created_at', { ascending: false })

  const total = orders?.length ?? 0
  const totalRevenue = orders
    ?.filter(o => ['paid', 'processing', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0) ?? 0

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{total} total</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Total revenue</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
              {totalRevenue.toLocaleString('en', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}
      </div>

      {!orders?.length ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
          <p className="text-sm text-gray-400">No orders yet.</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {orders.map(order => {
                const customer = order.customers as { full_name: string | null; email: string | null } | null
                const itemCount = Array.isArray(order.items) ? order.items.length : 0

                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    {/* Order ID */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium text-gray-900 dark:text-white">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      {order.payment_reference && (
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[120px]">
                          {order.payment_reference}
                        </p>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900 dark:text-white">
                        {customer?.full_name ?? <span className="text-gray-400">Guest</span>}
                      </p>
                      {customer?.email && (
                        <p className="text-xs text-gray-400 mt-0.5">{customer.email}</p>
                      )}
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {Number(order.total).toLocaleString('en', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Status — editable */}
                    <td className="px-4 py-3">
                      <OrderStatusSelect id={order.id} status={order.status} />
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('en', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
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
