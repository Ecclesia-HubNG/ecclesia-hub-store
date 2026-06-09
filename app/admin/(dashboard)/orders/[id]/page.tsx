import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'
import { OrderQuickActions } from '@/components/admin/OrderQuickActions'
import { OrderTracking } from '@/components/admin/OrderTracking'
import { DeleteOrderButton } from '@/components/admin/DeleteOrderButton'
import { SendConfirmationEmailButton } from '@/components/admin/SendConfirmationEmailButton'
import { OrderTimeline } from '@/components/admin/OrderTimeline'
import { getOrderEvents, type OrderEvent } from '@/lib/actions/order-events'

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  store:     { label: 'Store',     color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300' },
  instagram: { label: 'Instagram', color: 'bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400' },
  tiktok:    { label: 'TikTok',    color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  facebook:  { label: 'Facebook',  color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300' },
  whatsapp:  { label: 'WhatsApp',  color: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' },
  referral:  { label: 'Referral',  color: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400' },
  manual:    { label: 'Manual',    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400' },
}

const STATUS_COLORS: Record<string, string> = {
  pending:               'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
  pending_verification:  'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400',
  pending_bank_transfer: 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
  paid:                  'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  processing:            'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
  shipped:               'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400',
  delivered:             'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400',
  cancelled:             'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
  refunded:              'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
  payment_failed:        'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400',
}

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered']

function fmt(n: number) {
  return '₦' + Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const [{ data: customerRow }, storedEvents] = await Promise.all([
    order.customer_id
      ? supabase.from('customers').select('full_name, email, phone').eq('id', order.customer_id).maybeSingle()
      : Promise.resolve({ data: null }),
    getOrderEvents(order.id),
  ])

  const customer = customerRow as { full_name: string | null; email: string | null; phone?: string | null } | null
  const items: Array<{ product_id?: string; name: string; price: number; quantity: number; thumbnail?: string | null }> =
    Array.isArray(order.items) ? order.items : []
  const shipping = order.shipping_address as Record<string, string> | null
  const trackingNumber: string | null = (order as Record<string, unknown>).tracking_number as string | null ?? null
  const carrier: string | null = (order as Record<string, unknown>).carrier as string | null ?? null
  const adminNotes: string | null = (order as Record<string, unknown>).admin_notes as string | null ?? null
  const orderChannel: string = ((order as Record<string, unknown>).order_channel as string) ?? 'store'
  const isManual: boolean = ((order as Record<string, unknown>).is_manual as boolean) ?? false
  const channelMeta = CHANNEL_META[orderChannel]

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const isTerminal = ['cancelled', 'refunded'].includes(order.status)
  const currentStep = STATUS_STEPS.indexOf(order.status)

  // Derive timeline events from order fields
  const derivedEvents: Array<{ id: string; type: string; message: string; created_at: string }> = []
  const customerName = shipping
    ? [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || shipping.name || 'Customer'
    : 'Customer'

  derivedEvents.push({
    id: 'placed',
    type: 'derived',
    message: `Order placed by ${customerName}${orderChannel !== 'store' ? ` via ${CHANNEL_META[orderChannel]?.label ?? orderChannel}` : ''}`,
    created_at: order.created_at,
  })
  if (order.payment_reference) {
    derivedEvents.push({
      id: 'payment',
      type: 'payment',
      message: `Payment confirmed — ref: ${order.payment_reference}`,
      created_at: order.created_at,
    })
  }
  if (['processing', 'shipped', 'delivered'].includes(order.status)) {
    derivedEvents.push({
      id: 'processing',
      type: 'status',
      message: 'Order moved to processing',
      created_at: order.created_at,
    })
  }
  if (['shipped', 'delivered'].includes(order.status)) {
    derivedEvents.push({
      id: 'shipped',
      type: 'status',
      message: `Order shipped${(order as Record<string, unknown>).tracking_number ? ` — tracking: ${(order as Record<string, unknown>).tracking_number}` : ''}`,
      created_at: order.created_at,
    })
  }
  if (order.status === 'delivered') {
    derivedEvents.push({ id: 'delivered', type: 'status', message: 'Order delivered', created_at: order.created_at })
  }
  if (order.status === 'cancelled') {
    derivedEvents.push({ id: 'cancelled', type: 'status', message: 'Order cancelled', created_at: order.created_at })
  }
  if (order.status === 'refunded') {
    derivedEvents.push({ id: 'refunded', type: 'status', message: 'Order refunded', created_at: order.created_at })
  }
  if (order.status === 'payment_failed') {
    derivedEvents.push({ id: 'failed', type: 'status', message: 'Payment failed', created_at: order.created_at })
  }

  return (
    <div className="p-8 max-w-6xl">
      {/* Back */}
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white font-mono">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            {isManual && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 font-medium">manual</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Placed on {new Date(order.created_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {new Date(order.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
            </p>
            {channelMeta && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${channelMeta.color}`}>
                {channelMeta.label}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/orders/${order.id}/invoice`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Invoice
          </Link>
          <DeleteOrderButton id={order.id} orderNumber={order.id.slice(0, 8).toUpperCase()} />
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status] ?? STATUS_COLORS.pending}`}>
            {order.status}
          </span>
          <OrderStatusSelect id={order.id} status={order.status} />
        </div>
      </div>

      {/* Progress tracker — only for non-terminal statuses */}
      {!isTerminal && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep
              const active = i === currentStep
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'}`}>
                      {done && !active ? (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <p className={`text-[10px] mt-1 capitalize whitespace-nowrap ${active ? 'text-gray-900 dark:text-white font-semibold' : done ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-700'}`}>
                      {step}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-4 rounded-full transition-colors ${i < currentStep ? 'bg-gray-900 dark:bg-white' : 'bg-gray-100 dark:bg-gray-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Quick actions */}
          <OrderQuickActions id={order.id} status={order.status} />

          {/* Email */}
          {shipping?.email && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-4">Customer Email</h2>
              <SendConfirmationEmailButton id={order.id} email={shipping.email} />
            </div>
          )}

          {/* Tracking & Notes */}
          <OrderTracking
            id={order.id}
            trackingNumber={trackingNumber}
            carrier={carrier}
            adminNotes={adminNotes}
          />

          {/* Line items */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                Items <span className="text-gray-400 font-normal ml-1">({items.length})</span>
              </h2>
            </div>
            {items.length === 0 ? (
              <p className="px-5 py-6 text-sm text-gray-400">No items recorded.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover bg-gray-100 dark:bg-gray-800 shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0 flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">{fmt(item.price)} each</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(item.price * item.quantity)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">× {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totals */}
            <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                <span className="text-gray-700 dark:text-gray-300">{fmt(subtotal)}</span>
              </div>
              {Number(order.total) !== subtotal && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Adjustments</span>
                  <span className={Number(order.total) - subtotal < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}>
                    {Number(order.total) - subtotal < 0 ? '-' : '+'}{fmt(Math.abs(Number(order.total) - subtotal))}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-base font-bold text-gray-900 dark:text-white">{fmt(Number(order.total))}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <OrderTimeline
            orderId={order.id}
            events={storedEvents}
            derivedEvents={derivedEvents}
          />
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-72 shrink-0 space-y-4 sticky top-6">

          {/* Customer */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-3">Customer</h2>
            {customer ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.full_name ?? 'N/A'}</p>
                {customer.email && <p className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</p>}
                {customer.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone}</p>}
              </div>
            ) : shipping ? (
              <div className="space-y-1">
                {(shipping.firstName || shipping.lastName) && (
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {[shipping.firstName, shipping.lastName].filter(Boolean).join(' ')}
                    <span className="ml-1.5 text-[10px] text-gray-400 font-normal">guest</span>
                  </p>
                )}
                {shipping.email && <p className="text-xs text-gray-500 dark:text-gray-400">{shipping.email}</p>}
                {shipping.phone && <p className="text-xs text-gray-500 dark:text-gray-400">{shipping.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600">No customer info</p>
            )}
          </div>

          {/* Shipping address */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-3">Shipping address</h2>
            {shipping && Object.keys(shipping).length > 0 ? (
              <div className="space-y-0.5">
                {(shipping.firstName || shipping.lastName)
                  ? <p className="text-sm font-medium text-gray-900 dark:text-white">{[shipping.firstName, shipping.lastName].filter(Boolean).join(' ')}</p>
                  : shipping.name && <p className="text-sm font-medium text-gray-900 dark:text-white">{shipping.name}</p>
                }
                {shipping.address && <p className="text-xs text-gray-500 dark:text-gray-400">{shipping.address}</p>}
                {(shipping.city || shipping.state) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{[shipping.city, shipping.state].filter(Boolean).join(', ')}</p>
                )}
                {shipping.phone && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{shipping.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-600">No address provided</p>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-600 mb-3">Payment</h2>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Status</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[order.status] ?? ''}`}>{order.status}</span>
              </div>
              {order.payment_reference && (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mb-0.5">Reference</p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{order.payment_reference}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Total paid</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{fmt(Number(order.total))}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
