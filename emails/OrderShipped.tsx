import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Button, Hr, Preview,
} from '@react-email/components'

export type OrderShippedProps = {
  orderNumber: string
  customerName: string
  trackingNumber?: string
  carrier?: string
  items: { name: string; quantity: number }[]
  shippingAddress: { firstName: string; lastName: string; address: string; city: string; state: string }
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'

export default function OrderShipped({
  orderNumber = 'ORD-00001',
  customerName = 'Valued Customer',
  trackingNumber = 'TRK123456789',
  carrier = 'GIG Logistics',
  items = [{ name: 'Sample Bible', quantity: 1 }],
  shippingAddress = { firstName: 'John', lastName: 'Doe', address: '12 Faith Street', city: 'Lagos', state: 'Lagos' },
}: OrderShippedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order #{orderNumber} is on its way!</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '32px 40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 24, margin: 0, fontWeight: 700 }}>Ecclesia Hub</Heading>
            <Text style={{ color: 'rgba(255,255,255,0.7)', margin: '8px 0 0', fontSize: 13 }}>
              Faith resources delivered to your door
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '0 0 12px 12px' }}>
            {/* Truck icon area */}
            <Section style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ width: 64, height: 64, backgroundColor: '#fdf2f4', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Text style={{ fontSize: 28, margin: 0 }}>🚚</Text>
              </div>
            </Section>

            <Heading style={{ fontSize: 22, color: '#111', margin: '0 0 8px', textAlign: 'center' }}>
              Your Order is On Its Way!
            </Heading>
            <Text style={{ color: '#555', fontSize: 15, margin: '0 0 28px', textAlign: 'center' }}>
              Hi {customerName}, great news — your order has been shipped and is heading to you.
            </Text>

            {/* Tracking card */}
            {(trackingNumber || carrier) && (
              <Section style={{ backgroundColor: '#fdf2f4', border: `1px solid ${brand}30`, borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
                <Text style={{ margin: '0 0 4px', fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Tracking Information
                </Text>
                {carrier && (
                  <Row style={{ marginBottom: 6 }}>
                    <Column><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>Carrier</Text></Column>
                    <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111' }}>{carrier}</Text></Column>
                  </Row>
                )}
                {trackingNumber && (
                  <Row>
                    <Column><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>Tracking #</Text></Column>
                    <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 14, fontWeight: 600, color: brand }}>{trackingNumber}</Text></Column>
                  </Row>
                )}
              </Section>
            )}

            {/* Order number */}
            <Row style={{ marginBottom: 20 }}>
              <Column><Text style={{ margin: 0, fontSize: 14, color: '#555' }}>Order Number</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111' }}>#{orderNumber}</Text></Column>
            </Row>

            <Hr style={{ borderColor: '#eee', margin: '4px 0 20px' }} />

            {/* Items */}
            <Heading style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>
              Items Shipped
            </Heading>
            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: 8 }}>
                <Column>
                  <Text style={{ margin: 0, fontSize: 14, color: '#333' }}>
                    {item.name} <span style={{ color: '#888' }}>×{item.quantity}</span>
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: '#eee', margin: '24px 0' }} />

            {/* Address */}
            <Heading style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Delivering To
            </Heading>
            <Text style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.6 }}>
              {shippingAddress.firstName} {shippingAddress.lastName}<br />
              {shippingAddress.address}<br />
              {shippingAddress.city}, {shippingAddress.state}
            </Text>

            <Hr style={{ borderColor: '#eee', margin: '28px 0' }} />

            <Button
              href="https://ecclesiahub.store/account"
              style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              View Your Order
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '24px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 12, margin: '0 0 4px' }}>Ecclesia Hub · Lagos, Nigeria</Text>
            <Text style={{ color: '#aaa', fontSize: 12, margin: 0 }}>
              Questions? <Link href="mailto:hello@ecclesiahub.store" style={{ color: brandLight }}>hello@ecclesiahub.store</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
