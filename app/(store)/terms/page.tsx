import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service | Ecclesia Hub',
  description: 'The terms and conditions governing your use of Ecclesia Hub and purchases made on our store.',
}

const LAST_UPDATED = 'May 17, 2026'

const sections = [
  {
    title: '1. Acceptance of Terms',
    content: [
      {
        subtitle: '',
        text: 'By accessing or using the Ecclesia Hub website (ecclesiahub.store) or placing an order with us, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our services. These terms apply to all visitors, customers, and users of the site.',
      },
    ],
  },
  {
    title: '2. Our Products',
    content: [
      {
        subtitle: 'Product descriptions',
        text: 'We make every effort to display accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or any other content on our site is error-free. If a product you receive is materially different from its description, you are entitled to return it in accordance with our returns policy.',
      },
      {
        subtitle: 'Availability',
        text: 'All products are subject to availability. We reserve the right to limit quantities, discontinue products, or refuse orders at our discretion. If a product becomes unavailable after your order is placed, we will contact you with options for a substitute, backorder, or full refund.',
      },
      {
        subtitle: 'Pricing',
        text: 'All prices are listed in Nigerian Naira (₦) and are inclusive of applicable taxes unless otherwise stated. We reserve the right to change prices at any time without notice. Prices at checkout are final and apply to your specific order at the time of purchase.',
      },
    ],
  },
  {
    title: '3. Orders and Payment',
    content: [
      {
        subtitle: 'Placing an order',
        text: 'When you place an order, you are making an offer to purchase. We reserve the right to accept or decline any order. An order is confirmed when you receive an order confirmation email from us. Please ensure your email address and delivery details are correct before completing checkout.',
      },
      {
        subtitle: 'Payment',
        text: 'We accept payments via Paystack, which supports debit/credit cards, bank transfers, and USSD. Payment must be received in full before your order is processed. By providing payment information, you confirm that you are authorised to use the payment method.',
      },
      {
        subtitle: 'Order cancellation',
        text: 'You may cancel an order before it has been dispatched. Once an item has shipped, you will need to follow our returns process. We reserve the right to cancel any order due to pricing errors, stock issues, or suspected fraud, and will issue a full refund in such cases.',
      },
    ],
  },
  {
    title: '4. Shipping and Delivery',
    content: [
      {
        subtitle: 'Delivery times',
        text: 'Estimated delivery times are provided at checkout and vary by location within Nigeria. These are estimates only and are not guaranteed. We are not liable for delays caused by third-party couriers, adverse weather, or other circumstances beyond our control.',
      },
      {
        subtitle: 'Risk of loss',
        text: 'Risk of loss and title for products pass to you upon delivery to the carrier. If your order is lost in transit, please contact us and we will work with the courier to resolve the issue.',
      },
      {
        subtitle: 'Delivery address',
        text: 'You are responsible for providing a complete and accurate delivery address. We cannot be held responsible for orders delivered to an incorrect address provided by you. Re-delivery charges may apply if an order is returned due to an inaccurate address.',
      },
    ],
  },
  {
    title: '5. Returns and Refunds',
    content: [
      {
        subtitle: 'Return window',
        text: 'You may return most unopened items within 7 days of delivery for a full refund or exchange, provided the item is in its original condition and packaging. Certain items, including digital downloads and items damaged by misuse, are not eligible for return.',
      },
      {
        subtitle: 'How to return',
        text: 'To initiate a return, contact us at hello@ecclesiahub.store with your order number and reason for return. We will provide instructions for sending the item back. Return shipping costs are the responsibility of the customer unless the return is due to our error.',
      },
      {
        subtitle: 'Refunds',
        text: 'Approved refunds are processed within 5–10 business days to your original payment method. We will notify you by email once your refund has been issued.',
      },
    ],
  },
  {
    title: '6. User Accounts',
    content: [
      {
        subtitle: 'Account responsibility',
        text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to notify us immediately of any unauthorised use of your account.',
      },
      {
        subtitle: 'Account termination',
        text: 'We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activity, or are used to abuse our services. You may close your account at any time by contacting us.',
      },
    ],
  },
  {
    title: '7. Intellectual Property',
    content: [
      {
        subtitle: '',
        text: 'All content on this website — including text, images, logos, and design — is the property of Ecclesia Hub or our content suppliers and is protected by copyright law. You may not copy, reproduce, distribute, or create derivative works from any part of our website without our express written permission. Product images and descriptions provided by third-party brands remain their respective property.',
      },
    ],
  },
  {
    title: '8. Prohibited Activities',
    content: [
      {
        subtitle: 'You agree not to:',
        text: 'Use our website for any unlawful purpose; attempt to gain unauthorised access to any part of our systems; transmit any harmful, offensive, or fraudulent content; use automated tools to scrape, crawl, or harvest data from our site; or interfere with the proper functioning of our services.',
      },
    ],
  },
  {
    title: '9. Limitation of Liability',
    content: [
      {
        subtitle: '',
        text: 'To the fullest extent permitted by law, Ecclesia Hub shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or products. Our total liability to you for any claim shall not exceed the amount you paid for the specific product or service giving rise to the claim.',
      },
    ],
  },
  {
    title: '10. Disclaimer of Warranties',
    content: [
      {
        subtitle: '',
        text: 'Our services and products are provided "as is" and "as available" without warranties of any kind, either express or implied, except as required by applicable law. We do not warrant that our website will be uninterrupted, error-free, or free of viruses or other harmful components.',
      },
    ],
  },
  {
    title: '11. Governing Law',
    content: [
      {
        subtitle: '',
        text: 'These Terms of Service are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising from these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.',
      },
    ],
  },
  {
    title: '12. Changes to These Terms',
    content: [
      {
        subtitle: '',
        text: 'We may revise these Terms of Service at any time. Updated terms will be posted on this page with a revised "Last updated" date. Your continued use of our services after any changes constitutes your acceptance of the new terms. We encourage you to review this page periodically.',
      },
    ],
  },
  {
    title: '13. Contact Us',
    content: [
      {
        subtitle: '',
        text: 'If you have any questions or concerns about these Terms of Service, please contact us at hello@ecclesiahub.store or write to us at Ecclesia Hub, Lagos, Nigeria.',
      },
    ],
  },
]

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-[#6B1A2A] dark:text-[#D4849A] mb-3">Legal</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {LAST_UPDATED}</p>
        <p className="mt-4 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
          Please read these Terms of Service carefully before using our website or placing an order. They set out your rights and responsibilities as a customer of Ecclesia Hub.
        </p>
      </div>

      {/* Quick nav */}
      <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 mb-12">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">Contents</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {sections.map(s => (
            <a
              key={s.title}
              href={`#${s.title.replace(/\s+/g, '-').toLowerCase()}`}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#6B1A2A] dark:hover:text-[#D4849A] transition-colors truncate"
            >
              {s.title}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map(section => (
          <div key={section.title} id={section.title.replace(/\s+/g, '-').toLowerCase()}>
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
          <Link href="/privacy" className="text-sm text-[#6B1A2A] dark:text-[#D4849A] hover:underline">
            Privacy Policy
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
