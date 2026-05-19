import Link from 'next/link'

const CARDS = [
  {
    title: 'Frequently Asked\nQuestions',
    description: 'Everything you need to know about our products, shipping, and returns.',
    href: '/about#faq',
    bg: '#FFF0F3',
    imageBg: '#F5C6CF',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779112624846-xd2jtns8tyr.jpg',
  },
  {
    title: 'Online Payment\nProcess',
    description: 'Safe and secure payments powered by Paystack. Visa, Mastercard & more accepted.',
    href: '/about#payment',
    bg: '#F0FBF4',
    imageBg: '#B7E4C7',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779146731953-elrdp41g9gg.jpg',
  },
  {
    title: 'Home Delivery\nOptions',
    description: 'We deliver nationwide. Fast and reliable shipping right to your doorstep.',
    href: '/about#delivery',
    bg: '#FFFBEA',
    imageBg: '#FFE59E',
    image: 'https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779113596296-fn43gmt8l8h.jpg',
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
              <h3 className="text-lg font-black text-gray-900 leading-snug mb-2 whitespace-pre-line">
                {card.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
            </div>

            {/* Image */}
            <div className="mt-auto h-44 overflow-hidden" style={{ backgroundColor: card.imageBg }}>
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
