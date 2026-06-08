import { getMegaMenuConfig, getFooterConfig } from '@/lib/actions/menus'
import MenuEditor from '@/components/admin/MenuEditor'

export default async function MenuPage() {
  const [megaMenu, footer] = await Promise.all([
    getMegaMenuConfig(),
    getFooterConfig(),
  ])

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Menu</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Manage your store&apos;s header mega menu and footer navigation links.
        </p>
      </div>
      <MenuEditor initialMegaMenu={megaMenu} initialFooter={footer} />
    </div>
  )
}
