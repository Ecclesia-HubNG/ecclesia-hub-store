'use server'

import { createClient } from '@/lib/supabase/server'

const MIN_ORDER_AMOUNT = 10000 // ₦10,000

export async function checkScratchEligibility() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { eligible: false, reason: 'login', minAmount: MIN_ORDER_AMOUNT }

  // Must have at least one paid order above the threshold
  const { data: orders } = await supabase
    .from('orders')
    .select('id, total')
    .eq('customer_id', user.id)
    .eq('status', 'paid')
    .gte('total', MIN_ORDER_AMOUNT)
    .limit(1)

  if (!orders?.length) {
    return { eligible: false, reason: 'no_order', minAmount: MIN_ORDER_AMOUNT }
  }

  return { eligible: true, reason: null, minAmount: MIN_ORDER_AMOUNT }
}
