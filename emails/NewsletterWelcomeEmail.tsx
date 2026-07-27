import {
  Html, Head, Body, Container, Section, Heading, Text, Link, Button, Preview,
} from '@react-email/components'

export type NewsletterWelcomeEmailProps = {
  email: string
  couponCode?: string
  discountPercent?: number
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'
const rose = '#D4849A'
const ivory = '#FAF6F0'

export default function NewsletterWelcomeEmail({
  email = 'customer@example.com',
  couponCode = 'WELCOME15',
  discountPercent = 15,
}: NewsletterWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Here's your ${discountPercent}% off code, ${couponCode}`}</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '40px', textAlign: 'center' }}>
            <Text style={{ color: rose, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 10px' }}>
              Ecclesia Hub
            </Text>
            <Heading style={{ color: '#fff', fontSize: 26, margin: 0, fontWeight: 700 }}>
              You're in! 🎉
            </Heading>
          </Section>

          <Section style={{ backgroundColor: '#fff', padding: '44px 40px 40px', textAlign: 'center' }}>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
              Thanks for joining the Ecclesia Hub community. As promised, here's your exclusive discount on your next order.
            </Text>

            <Section style={{ backgroundColor: ivory, border: `1px dashed ${brandLight}`, borderRadius: 12, padding: '24px 20px', margin: '0 0 28px' }}>
              <Text style={{ margin: '0 0 6px', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                Your code
              </Text>
              <Text style={{ margin: 0, fontSize: 28, fontWeight: 700, color: brand, letterSpacing: 2 }}>
                {couponCode}
              </Text>
              <Text style={{ margin: '8px 0 0', fontSize: 13, color: '#888' }}>
                Saves you {discountPercent}% at checkout
              </Text>
            </Section>

            <Button
              href="https://ecclesiahub.store/shop"
              style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '14px 32px', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              Start Shopping →
            </Button>
          </Section>

          <Section style={{ textAlign: 'center', padding: '28px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 12, margin: '0 0 4px' }}>
              You're receiving this because you signed up for the Ecclesia Hub newsletter with {email}
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
