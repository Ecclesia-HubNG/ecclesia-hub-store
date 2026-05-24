import { createAdminClient } from '@/lib/supabase/admin'
import PromotionsManager from '@/components/admin/PromotionsManager'

export default async function PromotionsPage() {
  const supabase = createAdminClient()
  const { data: promotions } = await supabase
    .from('global_promotions')
    .select('id, name, discount_pct, is_active, applied_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Global Promotions</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Run a site-wide discount on all active products. Only one promotion can be live at a time.
          Ending a sale restores all original prices automatically.
        </p>
      </div>
      <PromotionsManager initial={promotions ?? []} />
    </div>
  )
}
