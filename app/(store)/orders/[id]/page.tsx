export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { getOrder } from '@/lib/actions/customer-orders'
import { OrderStatusLive } from '@/components/store/OrderStatusLive'

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

      <OrderStatusLive
        orderId={order.id}
        orderNumber={order.id.slice(0, 8).toUpperCase()}
        initialStatus={order.status}
        initialTrackingNumber={(order as Record<string, unknown>).tracking_number as string | null ?? null}
        initialCarrier={(order as Record<string, unknown>).carrier as string | null ?? null}
      >
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
      </OrderStatusLive>
    </div>
  )
}
