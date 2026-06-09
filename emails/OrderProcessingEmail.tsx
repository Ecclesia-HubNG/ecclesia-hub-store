import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Button, Hr, Img, Preview,
} from '@react-email/components'

export type OrderProcessingEmailProps = {
  orderNumber: string
  orderId: string
  customerName: string
  items: { name: string; quantity: number; price: number; thumbnail?: string; variant?: string }[]
  subtotal: number
  shipping: number
  total: number
  shippingAddress: {
    firstName: string; lastName: string; address: string; city: string; state: string; phone: string
  }
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'
const siteUrl = 'https://ecclesiahub.store'

export default function OrderProcessingEmail({
  orderNumber = 'ORD-00001',
  orderId = '',
  customerName = 'Valued Customer',
  items = [{ name: 'Sample Product', quantity: 1, price: 8500 }],
  subtotal = 8500,
  shipping = 1500,
  total = 10000,
  shippingAddress = { firstName: 'John', lastName: 'Doe', address: '12 Faith Street', city: 'Lagos', state: 'Lagos', phone: '08012345678' },
}: OrderProcessingEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment received — Order #{orderNumber} is now processing</Preview>
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

            {/* Payment confirmed badge */}
            <Section style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '14px 18px', marginBottom: 28, textAlign: 'center' }}>
              <Text style={{ margin: 0, fontSize: 14, color: '#15803d', fontWeight: 600 }}>
                ✓ Payment confirmed — your order is being processed
              </Text>
            </Section>

            <Heading style={{ fontSize: 22, color: '#111', margin: '0 0 8px' }}>
              Your order is processing!
            </Heading>
            <Text style={{ color: '#555', fontSize: 15, margin: '0 0 24px' }}>
              Hi {customerName}, we've received your payment and your order is now being prepared. We'll notify you when it ships.
            </Text>

            {/* Order number badge */}
            <Section style={{ backgroundColor: '#fdf2f4', border: `1px solid ${brand}30`, borderRadius: 8, padding: '12px 16px', marginBottom: 28 }}>
              <Text style={{ margin: 0, fontSize: 13, color: brandLight }}>
                Order Number: <strong style={{ color: brand }}>#{orderNumber}</strong>
              </Text>
            </Section>

            {/* Items */}
            <Heading style={{ fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Order Summary
            </Heading>
            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: 12 }}>
                <Column style={{ width: 44 }}>
                  {item.thumbnail ? (
                    <Img src={item.thumbnail} width={40} height={40} style={{ borderRadius: 6, objectFit: 'cover' }} alt={item.name} />
                  ) : (
                    <div style={{ width: 40, height: 40, backgroundColor: '#f0f0f0', borderRadius: 6 }} />
                  )}
                </Column>
                <Column>
                  <Text style={{ margin: 0, fontSize: 14, color: '#111', fontWeight: 600 }}>{item.name}</Text>
                  {item.variant && <Text style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>{item.variant}</Text>}
                  <Text style={{ margin: '2px 0 0', fontSize: 13, color: '#555' }}>Qty: {item.quantity}</Text>
                </Column>
                <Column style={{ textAlign: 'right' }}>
                  <Text style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111' }}>
                    ₦{(item.price * item.quantity).toLocaleString('en')}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />

            {/* Totals */}
            <Row style={{ marginBottom: 6 }}>
              <Column><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>Subtotal</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>₦{subtotal.toLocaleString('en')}</Text></Column>
            </Row>
            <Row style={{ marginBottom: 6 }}>
              <Column><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>Shipping</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>₦{shipping.toLocaleString('en')}</Text></Column>
            </Row>
            <Row>
              <Column><Text style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111' }}>Total</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 16, fontWeight: 700, color: brand }}>₦{total.toLocaleString('en')}</Text></Column>
            </Row>

            <Hr style={{ borderColor: '#eee', margin: '24px 0' }} />

            {/* Shipping address */}
            <Heading style={{ fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Shipping To
            </Heading>
            <Text style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.6 }}>
              {shippingAddress.firstName} {shippingAddress.lastName}<br />
              {shippingAddress.address}<br />
              {shippingAddress.city}, {shippingAddress.state}<br />
              {shippingAddress.phone}
            </Text>

            <Hr style={{ borderColor: '#eee', margin: '28px 0' }} />

            {/* CTA buttons */}
            <Row>
              <Column style={{ paddingRight: 8 }}>
                <Button
                  href={`${siteUrl}/orders/${orderId}`}
                  style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  Download Receipt
                </Button>
              </Column>
              <Column style={{ paddingLeft: 8 }}>
                <Button
                  href={`${siteUrl}/account`}
                  style={{ backgroundColor: '#f3f4f6', color: '#111', borderRadius: 8, padding: '12px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}
                >
                  Login &amp; Track Order
                </Button>
              </Column>
            </Row>
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
