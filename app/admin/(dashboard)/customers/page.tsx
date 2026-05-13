import { createClient } from '@/lib/supabase/server'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AdminCustomersPage() {
  const supabase = createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Customers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{customers?.length ?? 0} total</p>
      </div>

      {!customers?.length ? (
        <div className="text-center py-20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl">
          <p className="text-sm text-gray-400">No customers yet.</p>
        </div>
      ) : (
        <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Shipping address</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {customers.map(c => {
                const name = c.full_name || c.email?.split('@')[0] || 'Unknown'
                const address = c.shipping_address as { city?: string; state?: string } | null

                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E8C4CB] dark:bg-[#4A0F1C]/40 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#4A0F1C] dark:text-[#D4849A]">{getInitials(name)}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white leading-tight">{name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {c.phone ?? <span className="text-gray-300 dark:text-gray-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {address?.city
                        ? `${address.city}${address.state ? `, ${address.state}` : ''}`
                        : <span className="text-gray-300 dark:text-gray-600">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleDateString('en', {
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
