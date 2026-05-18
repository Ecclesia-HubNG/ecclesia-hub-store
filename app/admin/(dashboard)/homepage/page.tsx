import { createAdminClient } from '@/lib/supabase/admin'
import HeroWidgetEditor from '@/components/admin/HeroWidgetEditor'

export default async function HomepagePage() {
  const supabase = createAdminClient()
  const [{ data: widget }, { data: products }, { data: categories }] = await Promise.all([
    supabase.from('homepage_widgets').select('config').eq('type', 'hero').eq('is_active', true).maybeSingle(),
    supabase.from('products').select('id, name, thumbnail').eq('is_active', true).order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ])

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Homepage</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          Configure your store&apos;s hero section and homepage layout.
        </p>
      </div>
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-8 py-8">
        <HeroWidgetEditor
          initialConfig={widget?.config ?? null}
          products={products ?? []}
          categories={categories ?? []}
        />
      </div>
    </div>
  )
}
