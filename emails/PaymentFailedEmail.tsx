import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Button, Hr, Preview,
} from '@react-email/components'

export type PaymentFailedEmailProps = {
  customerName: string
  orderNumber: string
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'
const siteUrl = 'https://ecclesiahub.store'

export default function PaymentFailedEmail({
  customerName = 'Valued Customer',
  orderNumber = 'ORD-00001',
}: PaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment failed for order #{orderNumber} — please try again</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '32px 40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 24, margin: 0, fontWeight: 700 }}>Ecclesia Hub</Heading>
            <Text style={{ color: 'rgba(255,255,255,0.7)', margin: '8px 0 0', fontSize: 13 }}>
              Premium skincare delivered to your door
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '0 0 12px 12px' }}>

            {/* Failed badge */}
            <Section style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px 18px', marginBottom: 28, textAlign: 'center' }}>
              <Text style={{ margin: 0, fontSize: 14, color: '#dc2626', fontWeight: 600 }}>
                Payment could not be confirmed
              </Text>
            </Section>

            <Heading style={{ fontSize: 22, color: '#111', margin: '0 0 8px' }}>
              Payment failed
            </Heading>
            <Text style={{ color: '#555', fontSize: 15, margin: '0 0 8px' }}>
              Hi {customerName}, unfortunately we weren't able to confirm your payment for order <strong style={{ color: brand }}>#{orderNumber}</strong>.
            </Text>
            <Text style={{ color: '#555', fontSize: 15, margin: '0 0 28px' }}>
              Your cart items are still saved — you can try again or reach out to us if you need help.
            </Text>

            <Hr style={{ borderColor: '#eee', margin: '0 0 28px' }} />

            {/* CTA buttons */}
            <Row>
              <Column style={{ paddingRight: 8 }}>
                <Button
                  href={`${siteUrl}/cart`}
                  style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  Try Again
                </Button>
              </Column>
              <Column style={{ paddingLeft: 8 }}>
                <Button
                  href={`${siteUrl}/account`}
                  style={{ backgroundColor: '#f3f4f6', color: '#111', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  Login &amp; Send a Message
                </Button>
              </Column>
            </Row>

            <Hr style={{ borderColor: '#eee', margin: '28px 0 20px' }} />

            <Text style={{ color: '#888', fontSize: 13, margin: 0 }}>
              If you believe this is a mistake, please contact us at{' '}
              <Link href="mailto:hello@ecclesiahub.store" style={{ color: brandLight }}>hello@ecclesiahub.store</Link>{' '}
              and we'll be happy to help.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '24px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 12, margin: '0 0 4px' }}>
              Ecclesia Hub · Lagos, Nigeria
            </Text>
            <Text style={{ color: '#aaa', fontSize: 12, margin: 0 }}>
              Questions? Email us at{' '}
              <Link href="mailto:hello@ecclesiahub.store" style={{ color: brandLight }}>hello@ecclesiahub.store</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
