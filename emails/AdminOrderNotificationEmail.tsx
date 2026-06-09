import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Link, Button, Hr, Preview,
} from '@react-email/components'

export type AdminOrderNotificationEmailProps = {
  orderNumber: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  total: number
  paymentMethod: string
  status: string
  items: { name: string; quantity: number; price: number }[]
  address: string
  city: string
  state: string
  event: 'new_order' | 'payment_confirmed'
}

const brand = '#4A0F1C'
const adminUrl = 'https://ecclesiahub.store/admin/orders'

const EVENT_LABELS: Record<string, { title: string; badge: string; badgeBg: string; badgeColor: string }> = {
  new_order: {
    title: 'New order received',
    badge: 'New Order',
    badgeBg: '#fffbeb',
    badgeColor: '#b45309',
  },
  payment_confirmed: {
    title: 'Payment confirmed',
    badge: 'Payment Confirmed',
    badgeBg: '#f0fdf4',
    badgeColor: '#15803d',
  },
}

const METHOD_LABELS: Record<string, string> = {
  flutterwave: 'Flutterwave (card/bank)',
  bank_transfer: 'Bank Transfer',
}

export default function AdminOrderNotificationEmail({
  orderNumber = 'ORD-00001',
  orderId = '',
  customerName = 'Jane Doe',
  customerEmail = 'jane@example.com',
  customerPhone = '08012345678',
  total = 10000,
  paymentMethod = 'flutterwave',
  status = 'pending_verification',
  items = [{ name: 'Sample Product', quantity: 1, price: 10000 }],
  address = '12 Faith Street',
  city = 'Lagos',
  state = 'Lagos',
  event = 'new_order',
}: AdminOrderNotificationEmailProps) {
  const meta = EVENT_LABELS[event] ?? EVENT_LABELS.new_order

  return (
    <Html>
      <Head />
      <Preview>{meta.title} — #{orderNumber} · ₦{total.toLocaleString('en')}</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '24px 32px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 20, margin: 0, fontWeight: 700 }}>Ecclesia Hub — Admin</Heading>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '0 0 12px 12px' }}>

            {/* Event badge */}
            <Section style={{ backgroundColor: meta.badgeBg, border: `1px solid ${meta.badgeColor}40`, borderRadius: 8, padding: '10px 14px', marginBottom: 24, display: 'inline-block' }}>
              <Text style={{ margin: 0, fontSize: 13, color: meta.badgeColor, fontWeight: 600 }}>
                {meta.badge}
              </Text>
            </Section>

            <Heading style={{ fontSize: 20, color: '#111', margin: '0 0 4px' }}>
              Order #{orderNumber}
            </Heading>
            <Text style={{ color: '#888', fontSize: 13, margin: '0 0 24px' }}>
              Status: <strong style={{ color: '#111' }}>{status}</strong>
              &nbsp;·&nbsp;
              {METHOD_LABELS[paymentMethod] ?? paymentMethod}
            </Text>

            <Hr style={{ borderColor: '#eee', margin: '0 0 20px' }} />

            {/* Customer */}
            <Heading style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Customer
            </Heading>
            <Row style={{ marginBottom: 4 }}>
              <Column style={{ width: 80 }}><Text style={{ margin: 0, fontSize: 13, color: '#888' }}>Name</Text></Column>
              <Column><Text style={{ margin: 0, fontSize: 13, color: '#111', fontWeight: 600 }}>{customerName}</Text></Column>
            </Row>
            <Row style={{ marginBottom: 4 }}>
              <Column style={{ width: 80 }}><Text style={{ margin: 0, fontSize: 13, color: '#888' }}>Email</Text></Column>
              <Column><Text style={{ margin: 0, fontSize: 13, color: '#111' }}>{customerEmail}</Text></Column>
            </Row>
            <Row style={{ marginBottom: 4 }}>
              <Column style={{ width: 80 }}><Text style={{ margin: 0, fontSize: 13, color: '#888' }}>Phone</Text></Column>
              <Column><Text style={{ margin: 0, fontSize: 13, color: '#111' }}>{customerPhone}</Text></Column>
            </Row>
            <Row style={{ marginBottom: 4 }}>
              <Column style={{ width: 80 }}><Text style={{ margin: 0, fontSize: 13, color: '#888' }}>Address</Text></Column>
              <Column><Text style={{ margin: 0, fontSize: 13, color: '#111' }}>{address}, {city}, {state}</Text></Column>
            </Row>

            <Hr style={{ borderColor: '#eee', margin: '20px 0' }} />

            {/* Items */}
            <Heading style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
              Items ({items.length})
            </Heading>
            {items.map((item, i) => (
              <Row key={i} style={{ marginBottom: 8 }}>
                <Column>
                  <Text style={{ margin: 0, fontSize: 13, color: '#111' }}>{item.name}</Text>
                </Column>
                <Column style={{ textAlign: 'right', width: 120 }}>
                  <Text style={{ margin: 0, fontSize: 13, color: '#555' }}>
                    ×{item.quantity} · ₦{(item.price * item.quantity).toLocaleString('en')}
                  </Text>
                </Column>
              </Row>
            ))}

            <Hr style={{ borderColor: '#eee', margin: '16px 0' }} />

            <Row>
              <Column><Text style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111' }}>Total</Text></Column>
              <Column style={{ textAlign: 'right' }}><Text style={{ margin: 0, fontSize: 15, fontWeight: 700, color: brand }}>₦{total.toLocaleString('en')}</Text></Column>
            </Row>

            <Hr style={{ borderColor: '#eee', margin: '24px 0' }} />

            <Button
              href={`${adminUrl}/${orderId}`}
              style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '12px 24px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
            >
              View Order in Admin
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '20px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 11, margin: 0 }}>
              This is an automated notification from{' '}
              <Link href="https://ecclesiahub.store/admin" style={{ color: '#888' }}>Ecclesia Hub Admin</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
