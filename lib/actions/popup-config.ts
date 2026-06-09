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
  const { error } = await admin
    .from('popup_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', CONFIG_ID)
  if (error) return { error: error.message }
  revalidatePath('/admin/popup')
  return { success: true as const }
}
