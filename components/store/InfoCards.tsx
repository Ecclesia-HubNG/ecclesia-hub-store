import Link from 'next/link'

const CARDS = [
  {
    title: 'Frequently Asked Questions',
    description: 'Everything you need to know about our products, shipping, and returns.',
    href: '/about#faq',
    bg: '#FFF0F3',
    illustrationBg: '#F5C6CF',
    icon: (
      <svg className="w-20 h-20 text-[#B03050]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
      </svg>
    ),
  },
  {
    title: 'Online Payment Process',
    description: 'Safe and secure payments powered by Paystack. Visa, Mastercard & more accepted.',
    href: '/about#payment',
    bg: '#F0FBF4',
    illustrationBg: '#B7E4C7',
    icon: (
      <svg className="w-20 h-20 text-[#1A7A4A]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
      </svg>
    ),
  },
  {
    title: 'Home Delivery Options',
    description: 'We deliver nationwide. Fast and reliable shipping right to your doorstep.',
    href: '/about#delivery',
    bg: '#FFFBEA',
    illustrationBg: '#FFE59E',
    icon: (
      <svg className="w-20 h-20 text-[#92600A]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
  },
]

export default function InfoCards() {
  return (
    <section className="w-full px-3 md:px-5 pb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARDS.map(card => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex flex-col rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300"
            style={{ backgroundColor: card.bg }}
          >
            {/* Text */}
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-black text-gray-900 leading-snug mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
            </div>

            {/* Illustration panel */}
            <div className="mt-auto h-44 flex items-center justify-center" style={{ backgroundColor: card.illustrationBg }}>
              <div className="transition-transform duration-500 group-hover:scale-110">
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
