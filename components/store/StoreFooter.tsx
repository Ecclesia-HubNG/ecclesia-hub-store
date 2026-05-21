'use client'

import { useState } from 'react'
import Link from 'next/link'

const COLUMNS = {
  'Shop': [
    { label: 'Body Lotion', href: '/shop?category=body-lotion-1778779566716' },
    { label: 'Face Serum', href: '/shop?category=face-serum' },
    { label: 'Body Wash', href: '/shop?category=body-wash' },
    { label: 'Sunscreen', href: '/shop?category=sunscreen' },
    { label: 'Perfume Oil', href: '/shop?category=perfume-oil' },
  ],
  'About Us': [
    { label: 'About Ecclesia Hub', href: '/about' },
    { label: 'Our Brands', href: '/brands' },
    { label: 'News & Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Affiliate Program', href: '#' },
  ],
  'Services': [
    { label: 'Shipping & Delivery', href: '/about#delivery' },
    { label: 'Deals of the Day', href: '/deals' },
    { label: 'Shop by Brand', href: '/brands' },
    { label: 'New Arrivals', href: '/shop' },
    { label: 'Gift Card', href: '#' },
  ],
  'Help': [
    { label: 'Help Center', href: '/about#faq' },
    { label: 'Returns', href: '#' },
    { label: 'Contact Us', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  'Quick Links': [
    { label: 'Sign In', href: '/account' },
    { label: 'My Cart', href: '/cart' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Track Order', href: '/account' },
    { label: 'My Account', href: '/account' },
  ],
}

const SOCIALS = [
  {
    label: 'Instagram',
    href: '#',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>,
  },
  {
    label: 'X / Twitter',
    href: '#',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    label: 'Facebook',
    href: '#',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
  },
  {
    label: 'TikTok',
    href: '#',
    icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>,
  },
]

export default function StoreFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <footer className="px-3 md:px-5 pb-6 mt-4">
      <div className="bg-[#4A0F1C] rounded-3xl overflow-hidden">

        {/* ── Top: brand + nav columns ── */}
        <div className="px-8 md:px-14 pt-12 pb-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/">
              <img src="/logo.svg" alt="Ecclesia Hub" className="h-9 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed max-w-[200px]">
              Premium skincare and wellness, delivered across Nigeria.
            </p>
          </div>

          {/* Nav columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {Object.entries(COLUMNS).map(([title, links]) => (
              <div key={title}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4">{title}</p>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-white/60 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom card ── */}
        <div className="mx-3 mb-3 bg-[#F9F0E8] rounded-2xl px-8 md:px-12 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">

            {/* Left: big brand logo + tagline */}
            <div>
              <img src="/logo.svg" alt="Ecclesia Hub" className="h-12 md:h-16 w-auto mb-2 [filter:brightness(0)_saturate(100%)_invert(9%)_sepia(64%)_saturate(2400%)_hue-rotate(320deg)_brightness(80%)_contrast(110%)]" />
              <p className="text-sm text-[#4A0F1C]/50">Glow. Nourish. Thrive.</p>
            </div>

            {/* Right: newsletter + socials */}
            <div className="flex flex-col gap-4 md:items-end">
              <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 md:w-64 px-4 py-2.5 text-sm bg-white border border-[#4A0F1C]/10 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4A0F1C]/20 transition-colors"
                />
                <button
                  type="submit"
                  className={`px-4 py-2.5 rounded-xl transition-all shrink-0 ${
                    subscribed
                      ? 'bg-green-600 text-white'
                      : 'bg-[#4A0F1C] text-white hover:bg-[#3A0B15]'
                  }`}
                >
                  {subscribed ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </button>
              </form>

              {/* Socials + payment badges */}
              <div className="flex items-center gap-2">
                {SOCIALS.map(s => (
                  <a key={s.label} href={s.href} aria-label={s.label}
                    className="w-8 h-8 rounded-lg bg-[#4A0F1C]/8 hover:bg-[#4A0F1C] flex items-center justify-center text-[#4A0F1C] hover:text-white transition-colors">
                    {s.icon}
                  </a>
                ))}
                <div className="w-px h-5 bg-[#4A0F1C]/15 mx-1" />
                {/* Payment badges */}
                <div className="h-7 px-2.5 bg-white border border-[#4A0F1C]/10 rounded-lg flex items-center">
                  <svg viewBox="0 0 48 16" className="h-3.5 w-auto" fill="none">
                    <text x="0" y="12" fontFamily="Arial" fontWeight="900" fontSize="13" fill="#1A1F71">VISA</text>
                  </svg>
                </div>
                <div className="h-7 px-1.5 bg-white border border-[#4A0F1C]/10 rounded-lg flex items-center">
                  <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
                  <div className="w-4 h-4 rounded-full bg-[#F79E1B] -ml-2" />
                </div>
                <div className="h-7 px-2.5 bg-white border border-[#4A0F1C]/10 rounded-lg flex items-center">
                  <span className="text-[10px] font-black text-[#00C3F7]">Pay</span><span className="text-[10px] font-black text-[#011B33]">stack</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-6 pt-5 border-t border-[#4A0F1C]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs text-[#4A0F1C]/40">
              © {new Date().getFullYear()} Ecclesia Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              {[
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Contact', href: '/about' },
              ].map(({ label, href }) => (
                <Link key={label} href={href} className="text-xs text-[#4A0F1C]/40 hover:text-[#4A0F1C]/70 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}
