export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOrder } from '@/lib/actions/customer-orders'
import { CancelOrderButton } from '@/components/CancelOrderButton'

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'delivered'] as const
type Status = typeof STATUS_STEPS[number] | 'cancelled' | 'refunded' | 'pending_verification' | 'pending_bank_transfer'

const STATUS_LABEL: Record<string, string> = {
  pending_verification:  'Awaiting verification',
  pending_bank_transfer: 'Awaiting bank transfer',
  pending:               'Order placed',
  paid:                  'Payment confirmed',
  processing:            'Being prepared',
  shipped:               'Out for delivery',
  delivered:             'Delivered',
  cancelled:             'Cancelled',
  refunded:              'Refunded',
}

const STATUS_COLOUR: Record<string, string> = {
  pending_verification:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  pending_bank_transfer: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  pending:               'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid:                  'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  processing:            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  shipped:               'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  delivered:             'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled:             'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  refunded:              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
}

function Timeline({ status }: { status: Status }) {
  if (status === 'cancelled' || status === 'refunded') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLOUR[status]}`}>
        {status === 'cancelled' ? 'Order cancelled' : 'Order refunded'}
      </div>
    )
  }

  const currentIdx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number])

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const last = i === STATUS_STEPS.length - 1
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${done ? 'bg-[#4A0F1C] border-[#4A0F1C] text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <span className="text-[10px] font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${done ? 'text-[#4A0F1C] dark:text-[#E8C4CB]' : 'text-gray-400 dark:text-gray-600'}`}>
                {STATUS_LABEL[step]}
              </span>
            </div>
            {!last && (
              <div className={`h-0.5 w-8 sm:w-14 mb-5 transition-colors ${i < currentIdx ? 'bg-[#4A0F1C]' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id)
  if (!order) notFound()

  const shipping = order.shipping_address as Record<string, string> | null
  const items = (order.items ?? []) as {
    name: string
    price: number
    quantity: number
    thumbnail: string | null
    selectedVariants?: Array<{ groupName: string; value: string; price: number }> | null
    selectedVariant?: { groupName: string; value: string } | null
  }[]

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-1">Order confirmation</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Thank you for your order!</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Order <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">#{order.id.slice(0, 8).toUpperCase()}</span>
          {' · '}{new Date(order.created_at).toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Status badge */}
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mb-6 ${STATUS_COLOUR[order.status] ?? STATUS_COLOUR.pending}`}>
        {STATUS_LABEL[order.status] ?? order.status}
      </div>

      {/* Notice for orders awaiting confirmation */}
      {order.status === 'pending_verification' && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">Payment verification in progress</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            Your payment is being confirmed. This usually takes a few seconds. If it doesn&apos;t update automatically,
            please quote your order number <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span> when contacting us.
          </p>
        </div>
      )}
      {order.status === 'pending_bank_transfer' && (
        <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-1">Waiting for your bank transfer</p>
          <p className="text-sm text-orange-700 dark:text-orange-400">
            Once we confirm your transfer, your order will be processed. Use order number{' '}
            <span className="font-mono font-semibold">#{order.id.slice(0, 8).toUpperCase()}</span> as your transfer reference.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-6 overflow-x-auto">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-5">Order status</h2>
        <Timeline status={order.status as Status} />
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Items ordered</h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 overflow-hidden shrink-0">
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.name}</p>
                {item.selectedVariants?.length
                  ? item.selectedVariants.map(sv => (
                      <p key={`${sv.groupName}:${sv.value}`} className="text-xs text-gray-500">{sv.groupName}: {sv.value}</p>
                    ))
                  : item.selectedVariant && (
                      <p className="text-xs text-gray-500">{item.selectedVariant.groupName}: {item.selectedVariant.value}</p>
                    )
                }
                <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
                ₦{(item.price * item.quantity).toLocaleString('en')}
              </p>
            </div>
          ))}
        </div>

        {(() => {
          const shippingFee = Number((order as Record<string, unknown>).shipping_fee ?? 0)
          const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
          return (
            <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString('en')}</span>
              </div>
              {shippingFee > 0 && (
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>Shipping</span>
                  <span>₦{shippingFee.toLocaleString('en')}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Total</span>
                <span className="text-base font-bold text-[#4A0F1C] dark:text-[#E8C4CB]">₦{Number(order.total).toLocaleString('en')}</span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Shipping address */}
      {shipping && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Shipping to</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {shipping.firstName} {shipping.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{shipping.address}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{shipping.city}, {shipping.state}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{shipping.email} · {shipping.phone}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Link href="/shop" className="px-5 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors">
            Continue shopping
          </Link>
          <Link href="/account/orders" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            My orders
          </Link>
        </div>
        {['pending', 'pending_verification', 'pending_bank_transfer'].includes(order.status) && (
          <CancelOrderButton id={order.id} />
        )}
      </div>
    </div>
  )
}
