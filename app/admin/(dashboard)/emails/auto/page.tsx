export default function AutoEmailsPage() {
  const triggers = [
    {
      event: 'Order Confirmed',
      description: 'Sent when an order status is set to Paid or Processing',
      template: 'Order Confirmation',
      active: true,
      icon: '✓',
      color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/40',
    },
    {
      event: 'Order Shipped',
      description: 'Sent when an order status is set to Shipped, includes tracking info',
      template: 'Order Shipped',
      active: true,
      icon: '📦',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
    },
    {
      event: 'Order Delivered',
      description: 'Sent when an order status is set to Delivered',
      template: 'Order Confirmation',
      active: true,
      icon: '🏠',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      event: 'Welcome Email',
      description: 'Sent when a new customer account is created via Supabase Auth webhook',
      template: 'Welcome',
      active: true,
      icon: '👋',
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40',
    },
    {
      event: 'Staff Invite',
      description: 'Sent when an admin invites a new staff member with a role',
      template: 'Staff Invite',
      active: true,
      icon: '✉️',
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
    },
    {
      event: 'Password Reset',
      description: 'Sent when an admin triggers a password reset for a staff member',
      template: 'Password Reset',
      active: true,
      icon: '🔐',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Auto Emails</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Emails sent automatically when specific events occur in your store
        </p>
      </div>

      <div className="grid gap-4 max-w-3xl">
        {triggers.map(t => (
          <div key={t.event} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${t.color}`}>
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.event}</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
              <p className="text-xs text-gray-400 mt-1.5">
                Template: <span className="font-medium text-gray-600 dark:text-gray-300">{t.template}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 max-w-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4">
        <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">Welcome email setup required</p>
        <p className="text-xs text-amber-700 dark:text-amber-400">
          The Welcome email uses a Supabase Auth webhook. In your Supabase dashboard go to{' '}
          <strong>Authentication → Hooks</strong> and add a POST webhook pointing to{' '}
          <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">https://ecclesiahub.store/api/webhooks/auth</code>.
          All other auto-emails fire automatically when you update order statuses in the admin.
        </p>
      </div>
    </div>
  )
}
