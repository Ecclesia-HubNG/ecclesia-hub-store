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
    .maybeSingle()
  return data
}

type HeroSlide = {
  id: string
  image?: string | null
  heading?: string | null
  subheading?: string | null
  cta_label?: string | null
  cta_href?: string | null
}

export async function upsertHeroWidget(config: {
  slides?: HeroSlide[]
  product_id?: string | null
  category_id?: string | null
  // legacy
  hero_image?: string | null
}) {
  const supabase = createAdminClient()
  const { data: existing } = await supabase
    .from('homepage_widgets')
    .select('id')
    .eq('type', 'hero')
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('homepage_widgets')
      .update({ config, is_active: true })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('homepage_widgets')
      .insert({ type: 'hero', config, position: 0, is_active: true })
    if (error) throw new Error(error.message)
  }
  revalidatePath('/', 'page')
  revalidatePath('/home', 'page')
}
