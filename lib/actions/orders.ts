'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendOrderShipped } from '@/lib/email'

export async function updateOrderStatus(formData: FormData) {
  const supabase = createClient()
  const id = formData.get('id') as string
  const status = formData.get('status') as string

  // Fetch order before updating so we have customer details for email
  const { data: order } = await supabase
    .from('orders')
    .select('items, shipping_address, tracking_number, carrier')
    .eq('id', id)
    .single()

  await supabase.from('orders').update({ status }).eq('id', id)

  // Send shipped email when order moves to 'shipped'
  if (status === 'shipped' && order?.shipping_address?.email) {
    const addr = order.shipping_address
    sendOrderShipped(addr.email, {
      orderNumber: id.slice(0, 8).toUpperCase(),
      customerName: `${addr.firstName ?? ''} ${addr.lastName ?? ''}`.trim(),
      trackingNumber: order.tracking_number ?? undefined,
      carrier: order.carrier ?? undefined,
      items: (order.items ?? []).map((i: any) => ({ name: i.name, quantity: i.quantity })),
      shippingAddress: addr,
    }).catch(() => {})
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
