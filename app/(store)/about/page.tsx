export const dynamic = 'force-static'

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Us | Ecclesia Hub',
  description: 'Get to know Ecclesia Hub — premium skincare and wellness delivered across Nigeria — plus shipping info, FAQs, and how to reach us.',
}

const VALUES = [
  {
    title: 'Curated, not mass-stocked',
    text: 'Every brand on Ecclesia Hub is chosen for quality and results, not just because it\'s trending. If we wouldn\'t use it ourselves, we don\'t sell it.',
  },
  {
    title: '100% authentic',
    text: 'We source directly from brands and authorised distributors. Every product you receive is genuine — no exceptions.',
  },
  {
    title: 'Delivered with care',
    text: 'From packaging to courier handoff, we treat every order like it\'s going to a friend, because for many of our customers, it is.',
  },
]

const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'Delivery times depend on your location and the delivery option you choose at checkout (Standard or Express). Estimated timeframes are shown before you pay, and you\'ll get updates by email as your order moves.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept card, bank transfer, and mobile money via Flutterwave, as well as direct bank transfer. A small processing fee (1.4%) applies to Flutterwave payments — bank transfer has none.',
  },
  {
    q: 'Do you deliver outside Lagos?',
    a: 'Yes — we deliver across Nigeria. Shipping rates and timeframes vary by state and are calculated at checkout once you enter your delivery address.',
  },
  {
    q: 'How do I track my order?',
    a: 'Sign in and visit "My Account → Orders" to see your order status. Once your order ships, we\'ll email you with tracking details if a courier tracking number is available.',
  },
  {
    q: 'Can I return or exchange a product?',
    a: 'Yes, most unopened items can be returned within 7 days of delivery. See our full Returns Policy for details.',
  },
  {
    q: 'How do I get in touch with a real person?',
    a: 'Email hello@ecclesiahub.store or use the WhatsApp button in the corner of any page — we usually reply within a few hours during business days.',
  },
]

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-3">Our Story</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">About Ecclesia Hub</h1>
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Ecclesia Hub is a Nigerian skincare and wellness store built around one idea: everyone deserves
          access to genuine, effective products without the guesswork. We hand-pick every brand we carry,
          ship quickly across the country, and treat every customer like part of the community — because
          that's exactly what you are.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-16">
        {VALUES.map(v => (
          <div key={v.title} className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{v.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{v.text}</p>
          </div>
        ))}
      </div>

      {/* Shipping & Delivery */}
      <div id="delivery" className="scroll-mt-24 mb-16">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          Shipping &amp; Delivery
        </h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <p>
            We deliver across Nigeria, including Lagos and every other state. At checkout, you'll choose
            a delivery type and location, and see the exact cost and estimated timeframe for your order
            before you pay — there are no surprise fees.
          </p>
          <p>
            Orders are processed once payment is confirmed. You'll receive an email confirmation
            immediately, and another when your order ships. If a tracking number is available from our
            courier, it will be included in that email.
          </p>
          <p>
            Payment is accepted via Flutterwave (card, bank transfer, mobile money — 1.4% processing fee,
            capped at ₦2,000) or direct bank transfer with no processing fee.
          </p>
        </div>
      </div>

      {/* FAQ */}
      <div id="faq" className="scroll-mt-24 mb-16">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {FAQS.map(f => (
            <details key={f.q} className="group bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-5 py-4 open:pb-4">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-medium text-gray-900 dark:text-white">
                {f.q}
                <svg className="w-4 h-4 shrink-0 text-gray-400 transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-[#4A0F1C] rounded-2xl px-8 py-10 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Still have a question?</h2>
        <p className="text-sm text-white/60 mb-6">Our team typically replies within a few hours on business days.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:hello@ecclesiahub.store" className="px-5 py-2.5 rounded-xl bg-white text-[#4A0F1C] text-sm font-semibold hover:bg-white/90 transition-colors">
            Email hello@ecclesiahub.store
          </a>
          <Link href="/shop" className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
