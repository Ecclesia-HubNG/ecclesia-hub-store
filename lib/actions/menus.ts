'use server'

import { unstable_cache, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_MEGA_MENU, DEFAULT_FOOTER } from '@/lib/menu-types'
import type { MegaMenuConfig, FooterConfig } from '@/lib/menu-types'

export type { MenuLink, MegaMenuColumn, MegaMenuConfig, FooterColumn, FooterConfig } from '@/lib/menu-types'

export const getMegaMenuConfig = unstable_cache(
  async (): Promise<MegaMenuConfig> => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('menus')
        .select('config')
        .eq('type', 'mega_menu')
        .maybeSingle()
      const cfg = data?.config as MegaMenuConfig | null
      if (cfg?.columns?.length) return cfg
    } catch {}
    return DEFAULT_MEGA_MENU
  },
  ['menus-mega'],
  { tags: ['menus'], revalidate: 3600 },
)

export const getFooterConfig = unstable_cache(
  async (): Promise<FooterConfig> => {
    try {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from('menus')
        .select('config')
        .eq('type', 'footer')
        .maybeSingle()
      const cfg = data?.config as FooterConfig | null
      if (cfg?.columns?.length) return cfg
    } catch {}
    return DEFAULT_FOOTER
  },
  ['menus-footer'],
  { tags: ['menus'], revalidate: 3600 },
)

export async function saveMegaMenuConfig(config: MegaMenuConfig) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('menus')
    .upsert({ type: 'mega_menu', config, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  revalidateTag('menus')
  return { ok: true }
}

export async function saveFooterConfig(config: FooterConfig) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('menus')
    .upsert({ type: 'footer', config, updated_at: new Date().toISOString() })
  if (error) return { error: error.message }
  revalidateTag('menus')
  return { ok: true }
}
