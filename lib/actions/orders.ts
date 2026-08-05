'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendOrderShipped, sendOrderConfirmation } from '@/lib/email'
import { logOrderEvent } from '@/lib/actions/order-events'
import { decrementStock, isStockConfirmingTransition, isConfirmedOrderStatus } from '@/lib/stock'

// Order line items come from two different origins with two different key
// styles: checkout-flow items use `productId` (camelCase), manual-order
// items use `product_id` (snake_case). Custom line items (no real product
// behind them) are prefixed "custom_" and skipped.
type RawOrderItem = {
  productId?: string
  product_id?: string
  quantity: number
  selectedVariants?: Array<{ groupName: string; value: string }> | null
}

function toStockItems(items: RawOrderItem[]) {
  const result: Array<{ productId: string; quantity: number; selectedVariants?: RawOrderItem['selectedVariants'] }> = []
  for (const i of items) {
    const productId = i.productId ?? i.product_id
    if (!productId || productId.startsWith('custom_')) continue
    result.push({ productId, quantity: i.quantity, selectedVariants: i.selectedVariants })
  }
  return result
}

export async function updateOrderStatus(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string

  const { data: order } = await supabase
    .from('orders')
    .select('status, items, shipping_address, tracking_number, carrier, total, subtotal, shipping_fee')
    .eq('id', id)
    .single()

  await supabase.from('orders').update({ status }).eq('id', id)
  await logOrderEvent(id, 'status', `Status changed to ${status}`)

  if (order && isStockConfirmingTransition(order.status, status)) {
    await decrementStock(createAdminClient(), toStockItems((order.items ?? []) as RawOrderItem[]))
    revalidatePath('/admin/products')
    revalidatePath('/home')
    revalidatePath('/shop')
  }

  const addr = order?.shipping_address
  const orderNumber = id.slice(0, 8).toUpperCase()
  const customerName = addr ? `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim() : ''
  const items = (order?.items ?? [] as any[]).map((i: any) => ({ name: i.name, quantity: i.quantity, price: i.price ?? 0, thumbnail: i.thumbnail, variant: i.variant }))

  if (addr?.email) {
    if (status === 'paid' || status === 'processing') {
      sendOrderConfirmation(addr.email, {
        orderNumber,
        customerName,
        items,
        subtotal: order?.subtotal ?? order?.total ?? 0,
        shipping: order?.shipping_fee ?? 0,
        total: order?.total ?? 0,
        shippingAddress: addr,
      }).catch(() => {})
      await logOrderEvent(id, 'email', `Order confirmation email sent to ${addr.email}`)
    }

    if (status === 'shipped') {
      sendOrderShipped(addr.email, {
        orderNumber,
        customerName,
        trackingNumber: order?.tracking_number ?? undefined,
        carrier: order?.carrier ?? undefined,
        items: items.map((i: { name: string; quantity: number }) => ({ name: i.name, quantity: i.quantity })),
        shippingAddress: addr,
      }).catch(() => {})
      await logOrderEvent(id, 'email', `Shipping confirmation email sent to ${addr.email}`)
    }

    if (status === 'delivered') {
      sendOrderConfirmation(addr.email, {
        orderNumber,
        customerName,
        items,
        subtotal: order?.subtotal ?? order?.total ?? 0,
        shipping: order?.shipping_fee ?? 0,
        total: order?.total ?? 0,
        shippingAddress: addr,
      }).catch(() => {})
      await logOrderEvent(id, 'email', `Delivery confirmation email sent to ${addr.email}`)
    }
  }

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${id}`)
  revalidatePath('/admin')
}

export async function updateOrderTracking(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const tracking_number = (formData.get('tracking_number') as string) || null
  const carrier = (formData.get('carrier') as string) || null
  const admin_notes = (formData.get('admin_notes') as string) || null
  await supabase.from('orders').update({ tracking_number, carrier, admin_notes }).eq('id', id)
  revalidatePath(`/admin/orders/${id}`)
}

export async function bulkUpdateOrderStatus(ids: string[], status: string) {
  const supabase = createClient()

  const { data: orders } = await supabase.from('orders').select('id, status, items').in('id', ids)
  await supabase.from('orders').update({ status }).in('id', ids)

  const toDecrement = (orders ?? []).filter(o => isStockConfirmingTransition(o.status, status))
  if (toDecrement.length > 0) {
    const admin = createAdminClient()
    for (const order of toDecrement) {
      await decrementStock(admin, toStockItems((order.items ?? []) as RawOrderItem[]))
    }
    revalidatePath('/admin/products')
    revalidatePath('/home')
    revalidatePath('/shop')
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function deleteOrder(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return {}
}

export async function sendOrderConfirmationEmail(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { data: order, error: fetchErr } = await supabase
    .from('orders')
    .select('id, total, subtotal, shipping_fee, items, shipping_address')
    .eq('id', id)
    .single()

  if (fetchErr || !order) return { error: 'Order not found.' }

  const shipping = order.shipping_address as Record<string, string> | null
  if (!shipping?.email) return { error: 'No email address on this order.' }

  const items = (Array.isArray(order.items) ? order.items : []) as Array<{
    name: string; price: number; quantity: number; thumbnail?: string | null
    selectedVariants?: Array<{ value: string }> | null
  }>

  try {
    await sendOrderConfirmation(shipping.email, {
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      customerName: [shipping.firstName, shipping.lastName].filter(Boolean).join(' ') || shipping.name || 'Customer',
      items: items.map(i => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        thumbnail: i.thumbnail ?? undefined,
        variant: Array.isArray(i.selectedVariants) && i.selectedVariants.length
          ? i.selectedVariants.map(sv => sv.value).join(', ')
          : undefined,
      })),
      subtotal: Number(order.subtotal ?? order.total),
      shipping: Number(order.shipping_fee ?? 0),
      total: Number(order.total),
      shippingAddress: {
        firstName: shipping.firstName ?? '',
        lastName: shipping.lastName ?? '',
        phone: shipping.phone ?? '',
        address: shipping.address ?? '',
        city: shipping.city ?? '',
        state: shipping.state ?? '',
      },
    })
    await logOrderEvent(id, 'email', `Confirmation email manually resent to ${shipping.email}`)
    return {}
  } catch (err: any) {
    return { error: err?.message ?? 'Failed to send email.' }
  }
}

export async function restoreOrder(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ deleted_at: null, deleted_by_role: null, deleted_by_email: null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/orders')
  revalidatePath('/admin/orders/deleted')
  revalidatePath('/admin')
  return {}
}

type ManualOrderItem = {
  product_id?: string
  name: string
  price: number
  quantity: number
  thumbnail?: string | null
}

export async function createManualOrder(payload: {
  customer_name: string
  customer_email: string
  customer_phone: string
  address: string
  city: string
  state: string
  items: ManualOrderItem[]
  subtotal: number
  shipping_fee: number
  total: number
  delivery_rate_id?: string
  delivery_label?: string
  status: string
  order_channel: string
  payment_reference: string
  admin_notes: string
}): Promise<{ error?: string; id?: string }> {
  const supabase = createAdminClient()

  const shipping_address = {
    firstName: payload.customer_name.split(' ')[0] ?? payload.customer_name,
    lastName: payload.customer_name.split(' ').slice(1).join(' ') || '',
    name: payload.customer_name,
    email: payload.customer_email,
    phone: payload.customer_phone,
    address: payload.address,
    city: payload.city,
    state: payload.state,
    country: 'Nigeria',
  }

  const { data, error } = await supabase
    .from('orders')
    .insert({
      status: payload.status,
      subtotal: payload.subtotal,
      shipping_fee: payload.shipping_fee,
      total: payload.total,
      items: payload.items,
      shipping_address,
      delivery_rate_id: payload.delivery_rate_id || null,
      delivery_label: payload.delivery_label || null,
      payment_reference: payload.payment_reference || null,
      order_channel: payload.order_channel,
      is_manual: true,
      admin_notes: payload.admin_notes || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Manual orders record a sale that's already happened (in-store, DM,
  // etc.), so inventory needs to come down the same as a paid online order
  // would. Only decrement here if it's created already "confirmed" (paid /
  // processing) — if it starts as pending, updateOrderStatus decrements it
  // once the admin later confirms it, so decrementing both here AND there
  // would double-count.
  if (isConfirmedOrderStatus(payload.status)) {
    await decrementStock(supabase, toStockItems(payload.items))
  }

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/home')
  revalidatePath('/shop')
  return { id: data.id }
}
