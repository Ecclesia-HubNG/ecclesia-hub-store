import {
  Html, Head, Body, Container, Section,
  Heading, Text, Link, Hr, Preview,
} from '@react-email/components'

export type NewsletterEmailProps = {
  subject: string
  previewText?: string
  body: string   // HTML-safe plain text or simple HTML
  issueNumber?: number
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'

export default function NewsletterEmail({
  subject = 'Ecclesia Hub Newsletter',
  previewText,
  body = 'Your newsletter content goes here.',
  issueNumber,
}: NewsletterEmailProps) {
  const date = new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Html>
      <Head />
      <Preview>{previewText ?? subject}</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Georgia, serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Header */}
          <Section style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#aaa', margin: 0, fontFamily: 'Arial, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
              {date}{issueNumber ? ` · Issue #${issueNumber}` : ''}
            </Text>
          </Section>

          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '32px 40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 26, margin: '0 0 4px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
              Ecclesia Hub
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 12, fontFamily: 'Arial, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
              Newsletter
            </Text>
          </Section>

          {/* Subject line as article title */}
          <Section style={{ backgroundColor: '#fff', padding: '36px 40px 8px' }}>
            <Heading style={{ fontSize: 24, color: '#111', margin: '0 0 16px', fontWeight: 700, lineHeight: 1.3 }}>
              {subject}
            </Heading>
            <Hr style={{ borderColor: '#eee', margin: '0 0 24px' }} />
          </Section>

          {/* Body content */}
          <Section style={{ backgroundColor: '#fff', padding: '0 40px 40px', borderRadius: '0 0 12px 12px' }}>
            {/* Render each paragraph split by newlines */}
            {body.split('\n').filter(Boolean).map((para, i) => (
              <Text
                key={i}
                style={{ fontSize: 16, color: '#333', lineHeight: 1.8, margin: '0 0 18px' }}
              >
                {para}
              </Text>
            ))}

            <Hr style={{ borderColor: '#eee', margin: '28px 0 24px' }} />

            <Text style={{ fontSize: 14, color: '#888', margin: 0, fontFamily: 'Arial, sans-serif' }}>
              — The Ecclesia Hub Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ textAlign: 'center', padding: '28px 0 0' }}>
            <Text style={{ color: '#aaa', fontSize: 12, margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>
              Ecclesia Hub · Lagos, Nigeria
            </Text>
            <Text style={{ color: '#aaa', fontSize: 12, margin: 0, fontFamily: 'Arial, sans-serif' }}>
              <Link href="https://ecclesiahub.store/shop" style={{ color: brandLight }}>Shop now</Link>
              {' · '}
              <Link href="https://ecclesiahub.store/privacy" style={{ color: '#aaa' }}>Unsubscribe</Link>
              {' · '}
              <Link href="mailto:hello@ecclesiahub.store" style={{ color: '#aaa' }}>Contact</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
