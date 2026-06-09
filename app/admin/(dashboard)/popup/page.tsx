import { getPopupConfig } from '@/lib/actions/popup-config'
import PopupManager from '@/components/admin/PopupManager'

export const metadata = { title: 'Popup Config — Admin' }

export default async function AdminPopupPage() {
  const config = await getPopupConfig()

  if (!config) {
    return (
      <div className="p-8">
        <p className="text-sm text-red-500">
          Popup config not found. Run the migration to create the popup_config table and seed row.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Newsletter Popup</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure the popup that appears to storefront visitors. Changes save instantly and take effect on the next page load.
        </p>
      </div>
      <PopupManager config={config} />
    </div>
  )
}
