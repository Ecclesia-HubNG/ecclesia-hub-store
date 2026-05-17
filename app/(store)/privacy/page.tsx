import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | Ecclesia Hub',
  description: 'How Ecclesia Hub collects, uses, and protects your personal information.',
}

const LAST_UPDATED = 'May 17, 2026'

const sections = [
  {
    title: '1. Information We Collect',
    content: [
      {
        subtitle: 'Information you provide',
        text: 'When you create an account, place an order, or contact us, we collect your name, email address, phone number, delivery address, and payment information. Payment card details are processed securely by our payment processor (Paystack) and are never stored on our servers.',
      },
      {
        subtitle: 'Information collected automatically',
        text: 'When you browse our store, we automatically collect your IP address, browser type, device identifiers, pages visited, and the date and time of your visit. We use cookies and similar tracking technologies to improve your experience and remember your preferences.',
      },
      {
        subtitle: 'Information from third parties',
        text: 'If you choose to sign in with Google, we receive your name, email address, and profile picture from Google as permitted by your Google account settings.',
      },
    ],
  },
  {
    title: '2. How We Use Your Information',
    content: [
      {
        subtitle: 'To fulfil your orders',
        text: 'We use your contact and delivery information to process payments, ship products, send order confirmations, and handle returns or refunds.',
      },
      {
        subtitle: 'To improve our services',
        text: 'We analyse usage patterns to improve our website, personalise your shopping experience, and develop new features and product offerings.',
      },
      {
        subtitle: 'To communicate with you',
        text: 'We may send you order updates, receipts, and — if you opt in — promotional emails about new products, sales, and events. You can unsubscribe from marketing emails at any time.',
      },
      {
        subtitle: 'To prevent fraud',
        text: 'We use your information to detect and prevent fraudulent transactions, abuse, and other harmful activities.',
      },
    ],
  },
  {
    title: '3. Sharing Your Information',
    content: [
      {
        subtitle: 'Service providers',
        text: 'We share your data with trusted third-party providers who help us operate our business: Supabase (database and authentication), Paystack (payment processing), Cloudflare (content delivery), and delivery partners. These providers are contractually bound to protect your data and may only use it to perform services on our behalf.',
      },
      {
        subtitle: 'Legal requirements',
        text: 'We may disclose your information where required by law, court order, or government regulation, or where we believe disclosure is necessary to protect our rights, your safety, or the safety of others.',
      },
      {
        subtitle: 'We do not sell your data',
        text: 'We will never sell, rent, or trade your personal information to third parties for their marketing purposes.',
      },
    ],
  },
  {
    title: '4. Cookies',
    content: [
      {
        subtitle: 'What we use cookies for',
        text: 'We use essential cookies to keep you signed in and maintain your shopping cart. We also use analytics cookies to understand how visitors interact with our site. You can disable non-essential cookies in your browser settings, though this may affect some features.',
      },
    ],
  },
  {
    title: '5. Data Retention',
    content: [
      {
        subtitle: 'How long we keep your data',
        text: 'We retain your account information for as long as your account is active. Order records are kept for seven years to comply with Nigerian financial regulations. You may request deletion of your account and personal data at any time by emailing us, subject to our legal obligations to retain certain records.',
      },
    ],
  },
  {
    title: '6. Your Rights',
    content: [
      {
        subtitle: 'Access and correction',
        text: 'You have the right to access the personal information we hold about you and to request corrections if any details are inaccurate.',
      },
      {
        subtitle: 'Deletion',
        text: 'You may request that we delete your personal data. We will honour such requests except where we are required to retain data by law.',
      },
      {
        subtitle: 'Opt-out of marketing',
        text: 'You can unsubscribe from our marketing emails at any time by clicking the unsubscribe link in any email or by contacting us directly.',
      },
    ],
  },
  {
    title: '7. Security',
    content: [
      {
        subtitle: 'How we protect your data',
        text: 'We use industry-standard security measures including HTTPS encryption, secure authentication, and row-level security on our database. While we strive to protect your information, no method of internet transmission or electronic storage is 100% secure. We encourage you to use a strong, unique password for your account.',
      },
    ],
  },
  {
    title: '8. Children\'s Privacy',
    content: [
      {
        subtitle: '',
        text: 'Our store is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.',
      },
    ],
  },
  {
    title: '9. Changes to This Policy',
    content: [
      {
        subtitle: '',
        text: 'We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by email or by displaying a prominent notice on our website. Your continued use of our services after changes become effective constitutes acceptance of the revised policy.',
      },
    ],
  },
  {
    title: '10. Contact Us',
    content: [
      {
        subtitle: '',
        text: 'If you have any questions about this Privacy Policy or how we handle your data, please contact us at hello@ecclesiahub.store or write to us at Ecclesia Hub, Lagos, Nigeria.',
      },
    ],
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-3">Legal</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          At Ecclesia Hub, we take your privacy seriously. This policy explains what personal information we collect, why we collect it, and how we use and protect it. By using our website and services, you agree to the practices described here.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              {section.title}
            </h2>
            <div className="space-y-4">
              {section.content.map((item, i) => (
                <div key={i}>
                  {item.subtitle && (
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5">
                      {item.subtitle}
                    </h3>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer nav */}
      <div className="mt-16 pt-8 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Ecclesia Hub. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-sm text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
            Terms of Service
          </Link>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <Link href="/shop" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
