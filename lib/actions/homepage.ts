'use server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getHeroWidget() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('homepage_widgets')
    .select('id, config')
    .eq('type', 'hero')
    .eq('is_active', true)
    .single()
  return data
}

export async function upsertHeroWidget(config: {
  hero_image?: string | null
  product_id?: string | null
  category_id?: string | null
}) {
  const supabase = createAdminClient()
  // Check if exists
  const { data: existing } = await supabase
    .from('homepage_widgets')
    .select('id')
    .eq('type', 'hero')
    .single()

  if (existing) {
    await supabase.from('homepage_widgets').update({ config, is_active: true }).eq('id', existing.id)
  } else {
    await supabase.from('homepage_widgets').insert({ type: 'hero', config, position: 0, is_active: true })
  }
  revalidatePath('/')
  revalidatePath('/home')
}
