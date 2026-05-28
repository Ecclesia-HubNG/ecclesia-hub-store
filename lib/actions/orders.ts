'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendOrderShipped, sendOrderConfirmation } from '@/lib/email'

export async function updateOrderStatus(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string

  const { data: order } = await supabase
    .from('orders')
    .select('items, shipping_address, tracking_number, carrier, total, subtotal, shipping_fee')
    .eq('id', id)
    .single()

  await supabase.from('orders').update({ status }).eq('id', id)

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
  await supabase.from('orders').update({ status }).in('id', ids)
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
      payment_reference: payload.payment_reference || null,
      order_channel: payload.order_channel,
      is_manual: true,
      admin_notes: payload.admin_notes || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/orders')
  revalidatePath('/admin')
  return { id: data.id }
}
