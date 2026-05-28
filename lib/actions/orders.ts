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
  total: number
  status: string
  order_channel: string
  payment_reference: string
  admin_notes: string
}): Promise<{ error?: string; id?: string }> {
  const supabase = createAdminClient()

  const shipping_address = {
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
