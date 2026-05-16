'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'

const NAV_LINKS = [
  { href: '/home', label: 'Home' },
  { href: '/shop', label: 'Shop' },
  { href: '/about', label: 'About' },
  { href: '/account', label: 'Account' },
]

export default function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { count } = useCart()

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/80">
        <div className="relative h-16 flex items-center px-5 md:px-8">

          {/* ── Left ── */}
          <div className="flex items-center gap-5 flex-1">
            {/* Hamburger */}
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              className="flex flex-col justify-center gap-[5px] p-1 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <span className="block w-5 h-px bg-current" />
              <span className="block w-5 h-px bg-current" />
              <span className="block w-3.5 h-px bg-current" />
            </button>

            {/* Search */}
            <Link
              href="/shop"
              className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              Search
            </Link>
          </div>

          {/* ── Center — Brand ── */}
          <Link
            href="/home"
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap"
          >
            <span className="text-base md:text-lg font-bold tracking-[0.18em] uppercase text-gray-900 dark:text-white select-none">
              Ecclesia Hub
            </span>
          </Link>

          {/* ── Right ── */}
          <div className="flex items-center gap-1 flex-1 justify-end">
            {/* Mobile search */}
            <Link
              href="/shop"
              aria-label="Search"
              className="sm:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </Link>

            {/* Cart — shopping bag */}
            <Link
              href="/cart"
              aria-label="Cart"
              className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
              </svg>
              {count > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 bg-[#4A0F1C] text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            {/* Account — person */}
            <Link
              href="/account"
              aria-label="Account"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile / hamburger menu drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="relative w-72 max-w-[85vw] bg-white dark:bg-gray-950 h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 h-16 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-bold tracking-[0.15em] uppercase text-gray-900 dark:text-white">
                Ecclesia Hub
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/60 rounded-xl transition-colors"
                >
                  {link.label}
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-400 dark:text-gray-600">Faith. Word. Life.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
