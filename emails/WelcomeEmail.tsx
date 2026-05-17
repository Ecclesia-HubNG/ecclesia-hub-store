import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Button, Hr, Preview,
} from '@react-email/components'

export type WelcomeEmailProps = {
  name?: string
  email: string
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'

export default function WelcomeEmail({ name = 'Friend', email = 'customer@example.com' }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Ecclesia Hub — Faith resources for every believer</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 28, margin: '0 0 8px', fontWeight: 700 }}>
              Welcome to Ecclesia Hub
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: 15 }}>
              Faith resources for every believer
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: '#fff', padding: '44px 40px', borderRadius: '0 0 12px 12px' }}>
            <Text style={{ fontSize: 24, margin: '0 0 4px' }}>👋</Text>
            <Heading style={{ fontSize: 20, color: '#111', margin: '8px 0 16px' }}>
              Hi {name}, great to have you!
            </Heading>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>
              Thank you for joining Ecclesia Hub. We're a faith-based store delivering quality Bibles, books, devotionals, and more straight to your door — right here in Nigeria.
            </Text>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
              Whether you're building your personal library, equipping your church, or finding the perfect faith-based gift, we've got you covered.
            </Text>

            <Button
              href="https://ecclesiahub.store/shop"
              style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '14px 32px', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
            >
              Browse the Store →
            </Button>

            <Hr style={{ borderColor: '#eee', margin: '12px 0 28px' }} />

            {/* Features */}
            <Section>
              {[
                { icon: '📖', title: 'Bibles & Study Guides', desc: 'KJV, NIV, and more with in-depth study notes.' },
                { icon: '🚚', title: 'Fast Nationwide Delivery', desc: 'We ship to all states across Nigeria.' },
                { icon: '🔒', title: 'Secure Checkout', desc: 'Pay safely with Paystack — cards, transfer, USSD.' },
              ].map(f => (
                <Row key={f.title} style={{ marginBottom: 18 }}>
                  <Column style={{ width: 44 }}>
                    <Text style={{ fontSize: 22, margin: 0 }}>{f.icon}</Text>
                  </Column>
                  <Column>
                    <Text style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#111' }}>{f.title}</Text>
                    <Text style={{ margin: 0, fontSize: 13, color: '#777' }}>{f.desc}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '28px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 12, margin: '0 0 4px' }}>
              You're receiving this because you created an account with {email}
            </Text>
            <Text style={{ color: '#aaa', fontSize: 12, margin: 0 }}>
              Ecclesia Hub · Lagos, Nigeria ·{' '}
              <Link href="mailto:hello@ecclesiahub.store" style={{ color: brandLight }}>hello@ecclesiahub.store</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

