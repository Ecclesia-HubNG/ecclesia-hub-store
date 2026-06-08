import { getMegaMenuConfig, getFooterConfig } from '@/lib/actions/menus'
import { createAdminClient } from '@/lib/supabase/admin'
import MenuEditor from '@/components/admin/MenuEditor'

export default async function MenuPage() {
  const supabase = createAdminClient()
  const [megaMenu, footer, { data: categories }, { data: brands }] = await Promise.all([
    getMegaMenuConfig(),
    getFooterConfig(),
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase.from('brands').select('id, name, slug').order('name'),
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Manage your store&apos;s header mega menu and footer navigation links.
        </p>
      </div>
      <MenuEditor
        initialMegaMenu={megaMenu}
        initialFooter={footer}
        categories={(categories ?? []).map(c => ({ label: c.name, href: `/category/${c.slug}` }))}
        brands={(brands ?? []).map(b => ({ label: b.name, href: `/brands/${b.slug}` }))}
      />
    </div>
  )
}
