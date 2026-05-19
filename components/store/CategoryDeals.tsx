import Link from 'next/link'

type Deal = {
  label: string
  amount: string
  description: string
  image: string
  href: string
  bg: string
  accent: string
}

const DEALS: Deal[] = [
  {
    label: 'Save',
    amount: '₦3,000',
    description: 'Deeply nourish your skin with our bestselling body lotions.',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779112624846-xd2jtns8tyr.jpg',
    href: '/shop?category=body-lotion-1778779566716',
    bg: '#FEF3EC',
    accent: '#C4622D',
  },
  {
    label: 'Save',
    amount: '₦5,000',
    description: 'Brighten and firm with our concentrated face serums.',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779146731953-elrdp41g9gg.jpg',
    href: '/shop?category=face-serum',
    bg: '#FDEEF1',
    accent: '#B03050',
  },
  {
    label: 'Save',
    amount: '₦2,000',
    description: 'Gentle, skin-loving body washes for your daily ritual.',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779113596296-fn43gmt8l8h.jpg',
    href: '/shop?category=body-wash',
    bg: '#FFFBEA',
    accent: '#9A7D0A',
  },
  {
    label: 'Save',
    amount: '₦4,000',
    description: 'Long-lasting, alcohol-free scents crafted for your skin.',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779146304123-a37twwgkbq.jpg',
    href: '/shop?category=perfume-oil',
    bg: '#EEF0FE',
    accent: '#3D52C4',
  },
]

export default function CategoryDeals() {
  return (
    <section className="w-full px-3 md:px-5 pb-16">
      {/* Heading */}
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6B1A2A] dark:text-[#D4849A] mb-1">Limited time</p>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
          Get Up to 70% Off
        </h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {DEALS.map((deal) => (
          <Link
            key={deal.href}
            href={deal.href}
            className="group flex flex-col rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
            style={{ backgroundColor: deal.bg }}
          >
            {/* Text block */}
            <div className="px-5 pt-5 pb-4">
              <p className="text-sm font-semibold text-gray-700 mb-0.5">{deal.label}</p>
              <p className="text-3xl font-black mb-2" style={{ color: deal.accent }}>
                {deal.amount}
              </p>
              <p className="text-[13px] text-gray-600 leading-snug">{deal.description}</p>
            </div>

            {/* Image — fills bottom of card */}
            <div className="mt-auto h-80 overflow-hidden">
              <img
                src={deal.image}
                alt={deal.label}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
