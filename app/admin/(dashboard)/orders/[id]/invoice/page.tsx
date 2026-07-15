import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PrintButton } from '@/components/admin/PrintButton'

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const { data: customerRow } = order.customer_id
    ? await supabase.from('customers').select('full_name, email, phone').eq('id', order.customer_id).maybeSingle()
    : { data: null }

  const customer = customerRow as { full_name: string | null; email: string | null; phone?: string | null } | null
  const items: Array<{ name: string; price: number; quantity: number; selectedVariants?: Array<{ groupName: string; value: string }> | null; selectedVariant?: { groupName: string; value: string } | null }> =
    Array.isArray(order.items) ? order.items : []
  const shipping = order.shipping_address as Record<string, string> | null
  const trackingNumber: string | null = (order as Record<string, unknown>).tracking_number as string | null ?? null
  const carrier: string | null = (order as Record<string, unknown>).carrier as string | null ?? null

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const shippingFee: number = Number((order as Record<string, unknown>).shipping_fee ?? 0)
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      {/* Print toolbar — hidden on print */}
      <div className="print:hidden flex items-center gap-3 px-6 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <PrintButton />
        <Link href={`/admin/orders/${params.id}`} className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
          ← Back to order
        </Link>
      </div>

      {/* Invoice document */}
      <div className="max-w-3xl mx-auto px-8 py-10 print:p-8 bg-white">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Ecclesia Hub" className="h-9 w-auto object-contain shrink-0" />
            <div>
              <p className="font-bold text-gray-900 text-lg tracking-tight">Ecclesia Hub</p>
              <p className="text-xs text-gray-400">Premium Skincare</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">INVOICE</p>
            <p className="text-sm text-gray-500 mt-1 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-1">{invoiceDate}</p>
            <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
              ['paid', 'delivered'].includes(order.status) ? 'bg-green-50 text-green-700' :
              order.status === 'cancelled' ? 'bg-gray-100 text-gray-500' :
              'bg-amber-50 text-amber-700'
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Bill To</p>
            {customer ? (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-gray-900">{customer.full_name ?? 'N/A'}</p>
                {customer.email && <p className="text-sm text-gray-500">{customer.email}</p>}
                {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Guest checkout</p>
            )}
          </div>
          {shipping && Object.keys(shipping).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Ship To</p>
              <div className="space-y-0.5">
                {shipping.name && <p className="text-sm font-semibold text-gray-900">{shipping.name}</p>}
                {shipping.address && <p className="text-sm text-gray-500">{shipping.address}</p>}
                {(shipping.city || shipping.state) && (
                  <p className="text-sm text-gray-500">{[shipping.city, shipping.state].filter(Boolean).join(', ')}</p>
                )}
                {shipping.phone && <p className="text-sm text-gray-500">{shipping.phone}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Tracking (if set) */}
        {(trackingNumber || carrier) && (
          <div className="bg-gray-50 rounded-xl px-5 py-3 mb-8 flex items-center gap-8">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
            {carrier && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Carrier</p>
                <p className="text-sm font-medium text-gray-700">{carrier}</p>
              </div>
            )}
            {trackingNumber && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tracking #</p>
                <p className="text-sm font-mono text-gray-700">{trackingNumber}</p>
              </div>
            )}
          </div>
        )}

        {/* Line items */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-3">Item</th>
              <th className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-3 w-16">Qty</th>
              <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-3 w-28">Unit Price</th>
              <th className="text-right text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-3 w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="py-3.5 pr-4">
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  {item.selectedVariants?.length
                    ? item.selectedVariants.map(sv => (
                        <p key={`${sv.groupName}:${sv.value}`} className="text-xs text-gray-400 mt-0.5">{sv.groupName}: {sv.value}</p>
                      ))
                    : item.selectedVariant && (
                        <p className="text-xs text-gray-400 mt-0.5">{item.selectedVariant.groupName}: {item.selectedVariant.value}</p>
                      )
                  }
                </td>
                <td className="py-3.5 text-center text-sm text-gray-600">{item.quantity}</td>
                <td className="py-3.5 text-right text-sm text-gray-600">{fmt(item.price)}</td>
                <td className="py-3.5 text-right text-sm font-semibold text-gray-900">{fmt(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-72 space-y-2 mb-10">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700">{fmt(subtotal)}</span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Shipping</span>
              <span className="text-gray-700">{fmt(shippingFee)}</span>
            </div>
          )}
          {Number(order.total) !== subtotal + shippingFee && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Adjustments</span>
              <span className={Number(order.total) - subtotal - shippingFee < 0 ? 'text-green-600' : 'text-gray-700'}>
                {Number(order.total) - subtotal - shippingFee < 0 ? '-' : '+'}{fmt(Math.abs(Number(order.total) - subtotal - shippingFee))}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t-2 border-gray-900 pt-2.5">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{fmt(Number(order.total))}</span>
          </div>
          {order.payment_reference && (
            <p className="text-xs text-gray-400 pt-1">Ref: <span className="font-mono">{order.payment_reference}</span></p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">Thank you for your order!</p>
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} Ecclesia Hub</p>
        </div>
      </div>
    </>
  )
}
