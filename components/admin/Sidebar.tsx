'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import { can, ROLE_LABELS, ROLE_COLORS, type Role } from '@/lib/roles'
import { createClient } from '@/lib/supabase/client'

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

type NavChild = { label: string; href: string; exact?: boolean; section?: string }
type NavItem  = { label: string; href: string; icon: string; exact?: boolean; section?: string; children?: NavChild[] }

const ALL_NAV: NavItem[] = [
  {
    label: 'Dashboard', href: '/admin', exact: true, section: 'dashboard',
    icon: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  },
  {
    label: 'Homepage', href: '/admin/homepage', section: 'homepage',
    icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25',
  },
  {
    label: 'Media', href: '/admin/media', section: 'media',
    icon: 'M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  },
  {
    label: 'Products', href: '/admin/products', section: 'products',
    icon: 'M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z',
    children: [
      { label: 'All Products',    href: '/admin/products',     exact: true },
      { label: 'Add New Product', href: '/admin/products/new' },
      { label: 'Categories',      href: '/admin/categories' },
      { label: 'Brands',          href: '/admin/brands' },
      { label: 'Featured',        href: '/admin/featured' },
      { label: 'Coupons',         href: '/admin/coupons', section: 'coupons' },
    ],
  },
  {
    label: 'Orders', href: '/admin/orders', section: 'orders',
    icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z',
    children: [
      { label: 'All Orders',  href: '/admin/orders', exact: true },
      { label: 'New Order',   href: '/admin/orders/new' },
    ],
  },
  {
    label: 'Shipping', href: '/admin/shipping', section: 'shipping',
    icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  },
  {
    label: 'Customers', href: '/admin/customers', section: 'customers',
    icon: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
  },
  {
    label: 'Support', href: '/admin/support', section: 'support',
    icon: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z',
  },
  {
    label: 'Users', href: '/admin/users', section: 'users',
    icon: 'M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z',
    children: [
      { label: 'All Users',    href: '/admin/users',              exact: true },
      { label: 'Admins',       href: '/admin/users/admins' },
      { label: 'Editors',      href: '/admin/users/editors' },
      { label: 'Managers',     href: '/admin/users/managers' },
      { label: 'Shop Keepers', href: '/admin/users/shop-keepers' },
      { label: 'Financiers',   href: '/admin/users/financiers' },
    ],
  },
  {
    label: 'Finance', href: '/admin/finance', section: 'finance',
    icon: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z',
    children: [
      { label: 'Overview',     href: '/admin/finance',              exact: true },
      { label: 'Transactions', href: '/admin/finance/transactions' },
    ],
  },
  {
    label: 'Emails', href: '/admin/emails', section: 'emails',
    icon: 'M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75',
    children: [
      { label: 'Newsletter',   href: '/admin/emails/newsletter' },
      { label: 'Promo Blast',  href: '/admin/emails/promo' },
      { label: 'Subscribers',  href: '/admin/emails/subscribers' },
      { label: 'Auto Emails',  href: '/admin/emails/auto' },
      { label: 'Email Logs',   href: '/admin/emails/logs' },
    ],
  },
  {
    label: 'Settings', href: '/admin/settings', section: 'settings',
    icon: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  },
]

const EXPANDABLE_ROOTS = ['/admin/products', '/admin/orders', '/admin/users', '/admin/finance', '/admin/emails']

export default function AdminSidebar({ role }: { role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadSupport, setUnreadSupport] = useState(0)

  useEffect(() => {
    const supabase = createClient()

    supabase
      .from('inbox_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender', 'customer')
      .is('read_at', null)
      .then(({ count }) => setUnreadSupport(count ?? 0))

    const channel = supabase
      .channel('sidebar-support')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inbox_messages' }, (payload) => {
        if ((payload.new as any).sender === 'customer') setUnreadSupport(prev => prev + 1)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'inbox_messages' }, (payload) => {
        const n = payload.new as any
        const o = payload.old as any
        if (n.sender === 'customer' && !o.read_at && n.read_at) {
          setUnreadSupport(prev => Math.max(0, prev - 1))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const open = new Set<string>()
    for (const root of EXPANDABLE_ROOTS) {
      if (pathname.startsWith(root)) open.add(root)
    }
    return open
  })

  useEffect(() => {
    setOpenSections(prev => {
      const next = new Set(prev)
      for (const root of EXPANDABLE_ROOTS) {
        if (pathname.startsWith(root)) next.add(root)
      }
      return next
    })
  }, [pathname])

  function toggleSection(href: string) {
    setOpenSections(prev => {
      const next = new Set(prev)
      if (next.has(href)) next.delete(href)
      else next.add(href)
      return next
    })
  }

  const navItems = ALL_NAV.filter(item => {
    if (!item.section) return true
    return can(role, item.section as any)
  })

  const roleLabel = ROLE_LABELS[role as Role]
  const roleColor = ROLE_COLORS[role as Role]

  return (
    <aside className="w-60 bg-gray-900 flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="inline-block bg-white rounded-xl px-3 py-1.5 mb-1">
          <img src="/logo.svg" alt="Ecclesia Hub" className="h-7 w-auto" />
        </div>
        <p className="text-gray-500 text-xs mt-1">Admin Dashboard</p>
        {roleLabel && (
          <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleColor}`}>
            {roleLabel}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon, exact, children }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href)
          const isOpen = children ? openSections.has(href) : false

          return (
            <div key={href}>
              {children ? (
                <button
                  type="button"
                  onClick={() => {
                    toggleSection(href)
                    if (!openSections.has(href)) router.push(href)
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left ${
                    isOpen ? 'text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <Icon d={icon} />
                  <span className="flex-1">{label}</span>
                  <svg className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              ) : (
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-white/10 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <Icon d={icon} />
                  <span className="flex-1">{label}</span>
                  {href === '/admin/support' && unreadSupport > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-[#6B1A2A] text-white text-[10px] font-bold leading-none">
                      {unreadSupport > 99 ? '99+' : unreadSupport}
                    </span>
                  )}
                </Link>
              )}

              {children && isOpen && (
                <div className="mt-0.5 ml-3 pl-4 border-l border-white/10 space-y-0.5">
                  {children
                    .filter(child => {
                      if (child.section) return can(role, child.section as any)
                      return true
                    })
                    .map(child => {
                      const childActive = child.exact ? pathname === child.href : pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`flex items-center px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            childActive ? 'text-white font-medium bg-white/10' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                          }`}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-white/10">
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-gray-200 transition-colors"
          >
            <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
