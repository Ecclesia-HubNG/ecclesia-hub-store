'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-context'
import { useWishlist } from '@/lib/wishlist-context'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from '@/components/store/ThemeToggle'
import type { MegaMenuConfig } from '@/lib/menu-types'
import { DEFAULT_MEGA_MENU } from '@/lib/menu-types'

// ── Search overlay ─────────────────────────────────────────────────────────────
type SearchProduct = { id: string; name: string; slug: string; price: number; thumbnail: string | null; categories: { name: string } | null }

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounce = useRef<ReturnType<typeof setTimeout>>()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowDown') setFocused(p => Math.min(p + 1, results.length - 1))
      if (e.key === 'ArrowUp') setFocused(p => Math.max(p - 1, -1))
      if (e.key === 'Enter' && focused >= 0 && results[focused]) {
        router.push(`/product/${results[focused].slug}`)
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focused, results, onClose, router])

  const search = useCallback((q: string) => {
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, thumbnail, categories(name)')
        .ilike('name', `%${q.trim()}%`)
        .eq('is_active', true)
        .limit(6)
      setResults((data ?? []).map((p: any) => ({ ...p, categories: Array.isArray(p.categories) ? (p.categories[0] ?? null) : p.categories })))
      setLoading(false)
    }, 280)
  }, [supabase])

  useEffect(() => { search(query) }, [query, search])

  const fmt = (n: number) => '₦' + n.toLocaleString('en')

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative bg-white dark:bg-gray-950 w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideDown 0.2s ease-out' }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 md:px-8 h-16 border-b border-gray-100 dark:border-gray-800 max-w-3xl mx-auto">
          <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(-1) }}
            placeholder="Search products…"
            className="flex-1 text-base text-gray-900 dark:text-white placeholder-gray-400 bg-transparent focus:outline-none"
          />
          {loading && <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin shrink-0" />}
          <button type="button" onClick={onClose} className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-w-3xl mx-auto px-2 md:px-5 py-3 pb-4 space-y-0.5">
            {results.map((p, i) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                onClick={onClose}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-colors ${focused === i ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'}`}
                onMouseEnter={() => setFocused(i)}
              >
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-[#F8EEF0] dark:bg-[#2a1a1d] shrink-0">
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                  {p.categories && <p className="text-xs text-gray-400 mt-0.5">{p.categories.name}</p>}
                </div>
                <p className="text-sm font-semibold text-[#4A0F1C] dark:text-[#E8C4CB] shrink-0">{fmt(p.price)}</p>
              </Link>
            ))}
            <div className="pt-2 px-3">
              <Link
                href={`/shop?q=${encodeURIComponent(query)}`}
                onClick={onClose}
                className="text-xs font-medium text-[#4A0F1C] dark:text-[#D4849A] hover:underline"
              >
                See all results for &ldquo;{query}&rdquo; →
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && query.trim() && results.length === 0 && (
          <div className="max-w-3xl mx-auto px-5 py-6 text-sm text-gray-400">
            No products found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  )
}


// ── SVG icons ──────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )
}
function ChevronDown() {
  return (
    <svg className="w-3 h-3 ml-0.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

// ── Mobile drawer ──────────────────────────────────────────────────────────────
function MobileDrawer({
  open, onClose, user, onSignOut, shopColumns, plainNav,
}: { open: boolean; onClose: () => void; user: any; onSignOut: () => void; shopColumns: MegaMenuConfig['columns']; plainNav: MegaMenuConfig['plainNav'] }) {
  const [shopOpen, setShopOpen] = useState(false)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div className={`fixed top-0 left-0 bottom-0 z-50 w-80 max-w-[88vw] bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <img src="/logo.svg" alt="Ecclesia Hub" className="h-7 w-auto object-contain" />
          <button type="button" onClick={onClose} aria-label="Close menu" className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto">
          {/* Shop — accordion */}
          <div className="border-b border-gray-100">
            <button
              type="button"
              onClick={() => setShopOpen(p => !p)}
              className="flex items-center justify-between w-full px-6 py-4 text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Shop
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${shopOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            {shopOpen && (
              <div className="bg-gray-50/70 px-6 pb-5 pt-2 space-y-5 border-t border-gray-100">
                {shopColumns.map(col => (
                  <div key={col.heading}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">{col.heading}</p>
                    <ul className="space-y-2">
                      {col.links.map(link => (
                        <li key={link.label}>
                          <Link href={link.href} onClick={onClose} className="text-sm text-gray-600 hover:text-[#4A0F1C] transition-colors">
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {plainNav.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center justify-between px-6 py-4 text-sm font-medium text-gray-800 hover:bg-gray-50 border-b border-gray-100 transition-colors"
            >
              {item.label}
              <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-6 space-y-3">
          {user ? (
            <>
              <Link href="/account" onClick={onClose} className="flex items-center gap-3 text-sm text-gray-700 py-2">
                <PersonIcon />My Account
              </Link>
              <button type="button" onClick={onSignOut} className="flex items-center gap-3 text-sm text-red-500 py-2">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/account" onClick={onClose} className="flex items-center justify-center w-full px-4 py-2.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-xl hover:bg-[#3A0B15] transition-colors">
                Sign in
              </Link>
              <p className="text-xs text-center text-gray-400">
                <Link href="/account" onClick={onClose} className="hover:text-gray-600 transition-colors">Create account</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}

// ── Main header ────────────────────────────────────────────────────────────────
export default function StoreHeader({ megaMenu }: { megaMenu?: MegaMenuConfig }) {
  const shopColumns = megaMenu?.columns ?? DEFAULT_MEGA_MENU.columns
  const plainNav    = megaMenu?.plainNav ?? DEFAULT_MEGA_MENU.plainNav
const [megaOpen, setMegaOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const { count } = useCart()
  const { count: wishlistCount } = useWishlist()
  const accountRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()
  const pathname = usePathname()
  const supabase = createClient()

  // Close everything on route change
  useEffect(() => {
    setMegaOpen(false)
    setMobileOpen(false)
    setAccountOpen(false)
    setSearchOpen(false)
  }, [pathname])

  // Auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close account dropdown on outside click
  useEffect(() => {
    if (!accountOpen) return
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountOpen])

  // Lock body scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function openMega() {
    clearTimeout(closeTimer.current)
    setMegaOpen(true)
  }
  function scheduleMegaClose() {
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120)
  }

  async function signOut() {
    await supabase.auth.signOut()
    setAccountOpen(false)
    setUser(null)
  }

  return (
    <>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}


      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        {/* Main bar — aligned with hero card edges */}
        <div className="px-4 md:px-6 h-16 flex items-center gap-3">

          {/* Mobile: hamburger */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex flex-col justify-center gap-[5px] p-1.5 text-gray-700 hover:text-gray-900 transition-colors shrink-0"
          >
            <span className="block w-5 h-px bg-current" />
            <span className="block w-5 h-px bg-current" />
            <span className="block w-3.5 h-px bg-current" />
          </button>

          {/* Logo */}
          <Link href="/home" className="shrink-0">
            <img src="/logo.svg" alt="Ecclesia Hub" className="h-8 w-auto" />
          </Link>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center flex-1 justify-center gap-1">
            {/* Shop — mega trigger */}
            <button
              type="button"
              onMouseEnter={openMega}
              onMouseLeave={scheduleMegaClose}
              onClick={() => setMegaOpen(p => !p)}
              className={`flex items-center px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${megaOpen ? 'text-[#4A0F1C] bg-[#4A0F1C]/5' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
            >
              Shop <ChevronDown />
            </button>

            {plainNav.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Icons — right */}
          <div className="flex items-center gap-0.5 ml-auto md:ml-0">
            {/* Search */}
            <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className="p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <SearchIcon />
            </button>

            {/* Account */}
            <div ref={accountRef} className="relative">
              <button type="button" aria-label="Account" onClick={() => setAccountOpen(p => !p)} className="p-2.5 text-gray-500 hover:text-gray-900 transition-colors">
                <PersonIcon />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">{user.user_metadata?.full_name ?? 'My Account'}</p>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          My Account
                        </Link>
                        <Link href="/orders" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          My Orders
                        </Link>
                        <Link href="/wishlist" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          My Wishlist
                          {wishlistCount > 0 && <span className="ml-auto text-[10px] font-bold text-[#4A0F1C]">{wishlistCount}</span>}
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button type="button" onClick={signOut} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          Sign out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-1">
                      <Link href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Sign in</Link>
                      <Link href="/account" onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Create account</Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dark / light toggle */}
            <ThemeToggle />

            {/* Cart */}
            <Link href="/cart" aria-label="Cart" className="relative p-2.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
              <BagIcon />
              {count > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[15px] h-[15px] bg-[#4A0F1C] text-white text-[8px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* ── Mega menu panel ── */}
        {megaOpen && (
          <div
            onMouseEnter={openMega}
            onMouseLeave={scheduleMegaClose}
            className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-50 animate-in"
          >
            <div className="px-6 md:px-8 py-8 max-w-[1400px]">
              <div className="grid grid-cols-[1fr_1fr_1fr_272px] gap-10">
                {/* Link columns */}
                {shopColumns.map((col, ci) => (
                  <div key={col.heading}>
                    {ci === 0 && (
                      <Link
                        href="/shop"
                        onClick={() => setMegaOpen(false)}
                        className="block text-[10px] font-bold uppercase tracking-widest text-gray-900 hover:text-[#4A0F1C] mb-4 transition-colors"
                      >
                        {col.heading}
                      </Link>
                    )}
                    {ci !== 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">{col.heading}</p>
                    )}
                    <ul className="space-y-1">
                      {col.links.map(link => (
                        <li key={link.label}>
                          <Link
                            href={link.href}
                            onClick={() => setMegaOpen(false)}
                            className="group flex items-center gap-1.5 px-2 py-1.5 -mx-2 rounded-lg text-sm text-gray-600 hover:text-[#4A0F1C] hover:bg-[#4A0F1C]/5 transition-all"
                          >
                            <span className="w-0 group-hover:w-1.5 h-1.5 rounded-full bg-[#4A0F1C] transition-all duration-200 overflow-hidden shrink-0" />
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Editorial panel */}
                <div className="bg-[#4A0F1C] rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#D4849A] mb-3">
                      Glow. Nourish. Thrive.
                    </p>
                    <h3 className="text-[17px] font-bold text-white leading-snug mb-2.5">
                      Explore the Collection
                    </h3>
                    <p className="text-[13px] text-white/60 leading-relaxed">
                      Premium body care and skincare — crafted with intention, delivered across Nigeria.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    onClick={() => setMegaOpen(false)}
                    className="mt-6 inline-flex items-center justify-center px-4 py-2.5 bg-white text-[#4A0F1C] text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Shop All Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay — closes mega on click outside */}
      {megaOpen && (
        <div
          className="fixed inset-0 z-30"
          onMouseEnter={() => setMegaOpen(false)}
          onClick={() => setMegaOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        onSignOut={signOut}
        shopColumns={shopColumns}
        plainNav={plainNav}
      />
    </>
  )
}
