import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Button, Hr, Img, Preview,
} from '@react-email/components'

export type PromoProduct = {
  name: string
  price: number
  comparePrice?: number
  thumbnail?: string
  slug: string
}

export type PromoEmailProps = {
  subject: string
  headline: string
  subheadline?: string
  bannerText?: string
  products: PromoProduct[]
  ctaText?: string
  ctaUrl?: string
  footerNote?: string
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'

export default function PromoEmail({
  subject = 'Special Offer from Ecclesia Hub',
  headline = 'Exclusive Deals Just for You',
  subheadline = 'Limited time offer — shop now before it\'s gone.',
  bannerText = '🎉 SPECIAL OFFER',
  products = [
    { name: 'Study Bible KJV', price: 8500, comparePrice: 12000, slug: 'study-bible-kjv' },
    { name: 'Daily Devotional', price: 3500, slug: 'daily-devotional' },
    { name: 'Prayer Journal', price: 2500, comparePrice: 4000, slug: 'prayer-journal' },
  ],
  ctaText = 'Shop All Deals',
  ctaUrl = 'https://ecclesiahub.store/shop',
}: PromoEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '32px 40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 24, margin: 0, fontWeight: 700 }}>Ecclesia Hub</Heading>
          </Section>

          {/* Banner */}
          <Section style={{ background: `linear-gradient(135deg, ${brandLight}, #9B3A50)`, padding: '36px 40px', textAlign: 'center' }}>
            {bannerText && (
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 8px' }}>
                {bannerText}
              </Text>
            )}
            <Heading style={{ color: '#fff', fontSize: 28, margin: '0 0 10px', fontWeight: 800 }}>
              {headline}
            </Heading>
            {subheadline && (
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, margin: 0 }}>
                {subheadline}
              </Text>
            )}
          </Section>

          {/* Products */}
          <Section style={{ backgroundColor: '#fff', padding: '32px 24px' }}>
            <Heading style={{ fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 20px', textAlign: 'center' }}>
              Featured Products
            </Heading>

            <Row>
              {products.slice(0, 3).map((product, i) => (
                <Column key={i} style={{ width: `${100 / Math.min(products.length, 3)}%`, padding: '0 8px', textAlign: 'center', verticalAlign: 'top' }}>
                  <Link href={`https://ecclesiahub.store/product/${product.slug}`} style={{ textDecoration: 'none' }}>
                    {product.thumbnail ? (
                      <Img src={product.thumbnail} width={150} height={150} style={{ borderRadius: 10, objectFit: 'cover', width: '100%', maxWidth: 160 }} alt={product.name} />
                    ) : (
                      <Section style={{ backgroundColor: '#fdf2f4', borderRadius: 10, height: 140, marginBottom: 0 }} />
                    )}
                    <Text style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '10px 0 4px', lineHeight: 1.4 }}>
                      {product.name}
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: 700, color: brand, margin: '0 0 2px' }}>
                      ₦{product.price.toLocaleString('en')}
                    </Text>
                    {product.comparePrice && (
                      <Text style={{ fontSize: 12, color: '#aaa', textDecoration: 'line-through', margin: 0 }}>
                        ₦{product.comparePrice.toLocaleString('en')}
                      </Text>
                    )}
                  </Link>
                </Column>
              ))}
            </Row>
          </Section>

          {/* CTA */}
          <Section style={{ backgroundColor: '#fff', padding: '0 40px 40px', textAlign: 'center', borderRadius: '0 0 12px 12px' }}>
            <Hr style={{ borderColor: '#eee', margin: '0 0 28px' }} />
            <Button
              href={ctaUrl}
              style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '14px 36px', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              {ctaText} →
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '24px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 12, margin: '0 0 4px' }}>Ecclesia Hub · Lagos, Nigeria</Text>
            <Text style={{ color: '#aaa', fontSize: 12, margin: 0 }}>
              <Link href="https://ecclesiahub.store/privacy" style={{ color: '#aaa' }}>Unsubscribe</Link>
              {' · '}
              <Link href="mailto:hello@ecclesiahub.store" style={{ color: brandLight }}>Contact us</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
