'use server'

import { unstable_cache, revalidateTag } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type MenuLink     = { label: string; href: string }
export type MegaMenuColumn = { heading: string; links: MenuLink[] }
export type MegaMenuConfig = { columns: MegaMenuColumn[]; plainNav: MenuLink[] }
export type FooterColumn   = { title: string; links: MenuLink[] }
export type FooterConfig   = { columns: FooterColumn[] }

export const DEFAULT_MEGA_MENU: MegaMenuConfig = {
  columns: [
    {
      heading: 'Shop All',
      links: [
        { label: 'All Products', href: '/shop' },
        { label: 'New Arrivals', href: '/new-arrivals' },
        { label: 'Bestsellers',  href: '/shop' },
        { label: 'Gift Sets',    href: '/shop' },
        { label: 'Sale',         href: '/promotions' },
      ],
    },
    {
      heading: 'Categories',
      links: [
        { label: 'Body Care',          href: '/category/body-lotion-1778779566716' },
        { label: 'Fragrance',          href: '/category/perfume-oil' },
        { label: 'Skincare',           href: '/shop' },
        { label: 'Home & Wellness',    href: '/shop' },
        { label: 'Gifts & Accessories', href: '/shop' },
      ],
    },
    {
      heading: 'Collections',
      links: [
        { label: 'The Sanctuary Collection', href: '/shop' },
        { label: 'Daily Ritual',             href: '/shop' },
        { label: 'Gift Ideas',               href: '/shop' },
        { label: 'Bestsellers',              href: '/shop' },
        { label: 'New Arrivals',             href: '/shop' },
      ],
    },
  ],
  plainNav: [
    { label: 'Bestsellers',  href: '/shop' },
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Sale',         href: '/promotions' },
    { label: 'About',        href: '/about' },
  ],
}

export const DEFAULT_FOOTER: FooterConfig = {
  columns: [
    {
      title: 'Shop',
      links: [
        { label: 'Body Lotion', href: '/shop?category=body-lotion-1778779566716' },
        { label: 'Face Serum',  href: '/shop?category=face-serum' },
        { label: 'Body Wash',   href: '/shop?category=body-wash' },
        { label: 'Sunscreen',   href: '/shop?category=sunscreen' },
        { label: 'Perfume Oil', href: '/shop?category=perfume-oil' },
      ],
    },
    {
      title: 'About Us',
      links: [
        { label: 'About Ecclesia Hub', href: '/about' },
        { label: 'Our Brands',         href: '/brands' },
        { label: 'News & Blog',        href: '#' },
        { label: 'Careers',            href: '#' },
        { label: 'Affiliate Program',  href: '#' },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Shipping & Delivery', href: '/about#delivery' },
        { label: 'Deals of the Day',    href: '/deals' },
        { label: 'Shop by Brand',       href: '/brands' },
        { label: 'New Arrivals',        href: '/shop' },
        { label: 'Gift Card',           href: '#' },
      ],
    },
    {
      title: 'Help',
      links: [
        { label: 'Help Center',    href: '/about#faq' },
        { label: 'Returns',        href: '#' },
        { label: 'Contact Us',     href: '/about' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
    {
      title: 'Quick Links',
      links: [
        { label: 'Sign In',     href: '/account' },
        { label: 'My Cart',     href: '/cart' },
        { label: 'Wishlist',    href: '/wishlist' },
        { label: 'Track Order', href: '/account' },
        { label: 'My Account',  href: '/account' },
      ],
    },
  ],
}

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
