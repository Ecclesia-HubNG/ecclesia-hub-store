export const dynamic = 'force-static'

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Returns & Refunds | Ecclesia Hub',
  description: 'Our returns policy, how to start a return, what\'s eligible, and how refunds are processed at Ecclesia Hub.',
}

const STEPS = [
  {
    title: 'Contact us within 7 days',
    text: 'Email hello@ecclesiahub.store with your order number and the reason for your return, within 7 days of delivery.',
  },
  {
    title: 'We confirm eligibility',
    text: 'We\'ll check your order and reply with return instructions, including where to send the item back.',
  },
  {
    title: 'Send the item back',
    text: 'Pack the item in its original packaging where possible. Return shipping is covered by the customer unless the return is due to our error (wrong or damaged item).',
  },
  {
    title: 'Refund or exchange',
    text: 'Once we receive and inspect the item, we\'ll process your refund or exchange within 5–10 business days.',
  },
]

const NOT_ELIGIBLE = [
  'Opened or used skincare, cosmetics, and personal care items — for hygiene reasons',
  'Items marked "Final Sale" or purchased during a clearance promotion',
  'Products damaged through misuse after delivery',
  'Gift cards',
]

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-3">Customer Care</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Returns &amp; Refunds</h1>
        <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          We want you to love what you ordered. If something isn't right, here's exactly how returns work —
          no back-and-forth needed.
        </p>
      </div>

      {/* Steps */}
      <div className="mb-16">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 pb-2 border-b border-gray-100 dark:border-gray-800">
          How to return an item
        </h2>
        <div className="space-y-5">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#4A0F1C]/8 dark:bg-[#4A0F1C]/20 text-[#4A0F1C] dark:text-[#D4849A] flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Not eligible */}
      <div className="mb-16">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          What can't be returned
        </h2>
        <ul className="space-y-2.5">
          {NOT_ELIGIBLE.map(item => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Refunds */}
      <div className="mb-16">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
          Refunds
        </h2>
        <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          <p>
            Approved refunds are issued to your original payment method (card, bank transfer, or wallet)
            within 5–10 business days of us receiving the returned item. You'll get an email once your
            refund has been processed.
          </p>
          <p>
            If your order arrived damaged, incorrect, or faulty, contact us with a photo of the item —
            we'll arrange a replacement or full refund, including return shipping, at no cost to you.
          </p>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-[#4A0F1C] rounded-2xl px-8 py-10 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">Ready to start a return?</h2>
        <p className="text-sm text-white/60 mb-6">Have your order number ready — it speeds things up.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a href="mailto:hello@ecclesiahub.store" className="px-5 py-2.5 rounded-xl bg-white text-[#4A0F1C] text-sm font-semibold hover:bg-white/90 transition-colors">
            Email hello@ecclesiahub.store
          </a>
          <Link href="/account" className="px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">
            View My Orders
          </Link>
        </div>
      </div>
    </div>
  )
}
