'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export type PopupConfig = {
  id: string
  is_enabled: boolean
  image_url: string | null
  pre_headline: string
  headline: string
  body_text: string
  button_text: string
  dismiss_text: string
  delay_seconds: number
  suppress_days: number
  show_on_pages: string[]
  discount_value: number
  coupon_code: string
  updated_at: string
}

const CONFIG_ID = '00000000-0000-0000-0000-000000000001'

export async function getPopupConfig(): Promise<PopupConfig | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('popup_config')
    .select('*')
    .eq('id', CONFIG_ID)
    .single()
  return (data as PopupConfig) ?? null
}

export async function updatePopupConfig(updates: Partial<Omit<PopupConfig, 'id' | 'updated_at'>>) {
  const admin = createAdminClient()
  const { data: current } = await admin
    .from('popup_config')
    .select('coupon_code')
    .eq('id', CONFIG_ID)
    .single()

  const { error } = await admin
    .from('popup_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', CONFIG_ID)
  if (error) return { error: error.message }

  // The popup is the only place this coupon's value/availability is edited from,
  // so every save pushes those two fields straight into the coupon it grants —
  // otherwise the popup copy and what checkout actually honors can drift apart.
  const couponCode = current?.coupon_code
  if (couponCode && (updates.discount_value !== undefined || updates.is_enabled !== undefined)) {
    const couponUpdates: Record<string, unknown> = {}
    if (updates.discount_value !== undefined) couponUpdates.discount_value = updates.discount_value
    if (updates.is_enabled !== undefined) couponUpdates.is_active = updates.is_enabled
    await admin.from('coupons').update(couponUpdates).eq('code', couponCode)
  }

  revalidatePath('/admin/popup')
  revalidatePath('/', 'layout')
  return { success: true as const }
}
