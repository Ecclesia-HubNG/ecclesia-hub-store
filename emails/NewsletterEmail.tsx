import {
  Html, Head, Body, Container, Section,
  Heading, Text, Link, Hr, Preview, Img,
} from '@react-email/components'

export type NewsletterEmailProps = {
  subject: string
  previewText?: string
  body?: string        // plain-text fallback (newline-separated paragraphs)
  bodyHtml?: string    // rich HTML from editor (preferred)
  issueNumber?: number
  headerImage?: string
}

const brand = '#4A0F1C'
const brandLight = '#6B1A2A'

// Basic inline-style overrides so rich-text HTML renders well in email clients
const richTextStyles = `
  .nl-body { font-family: Georgia, serif; font-size: 16px; color: #333; line-height: 1.8; }
  .nl-body h1 { font-size: 26px; font-weight: 700; color: #111; margin: 0 0 18px; line-height: 1.3; font-family: Arial, sans-serif; }
  .nl-body h2 { font-size: 21px; font-weight: 700; color: #111; margin: 0 0 16px; line-height: 1.3; font-family: Arial, sans-serif; }
  .nl-body h3 { font-size: 17px; font-weight: 700; color: #111; margin: 0 0 14px; font-family: Arial, sans-serif; }
  .nl-body p  { margin: 0 0 16px; }
  .nl-body strong { font-weight: 700; }
  .nl-body em { font-style: italic; }
  .nl-body s  { text-decoration: line-through; }
  .nl-body ul { padding-left: 22px; margin: 0 0 16px; }
  .nl-body ol { padding-left: 22px; margin: 0 0 16px; }
  .nl-body li { margin-bottom: 6px; }
  .nl-body blockquote { border-left: 3px solid ${brand}; padding-left: 16px; margin: 0 0 16px; color: #666; }
  .nl-body code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-family: monospace; font-size: 14px; }
  .nl-body hr  { border: none; border-top: 1px solid #eee; margin: 22px 0; }
  .nl-body mark { background-color: #fff176; padding: 0 2px; }
  .nl-body a  { color: ${brand}; }
  .nl-body img { max-width: 100%; border-radius: 6px; margin: 8px 0; display: block; }
`

export default function NewsletterEmail({
  subject = 'Ecclesia Hub Newsletter',
  previewText,
  body = '',
  bodyHtml,
  issueNumber,
  headerImage,
}: NewsletterEmailProps) {
  const date = new Date().toLocaleDateString('en', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <Html>
      <Head>
        <style>{richTextStyles}</style>
      </Head>
      <Preview>{previewText ?? subject}</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Georgia, serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          {/* Date / issue */}
          <Section style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#aaa', margin: 0, fontFamily: 'Arial, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
              {date}{issueNumber ? ` · Issue #${issueNumber}` : ''}
            </Text>
          </Section>

          {/* Brand header */}
          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '32px 40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 26, margin: '0 0 4px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
              Ecclesia Hub
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.6)', margin: 0, fontSize: 12, fontFamily: 'Arial, sans-serif', letterSpacing: 1, textTransform: 'uppercase' }}>
              Newsletter
            </Text>
          </Section>

          {/* Optional header image */}
          {headerImage && (
            <Section style={{ backgroundColor: '#fff', padding: '24px 40px 0' }}>
              <Img src={headerImage} width={520} alt="" style={{ width: '100%', borderRadius: 8, display: 'block', objectFit: 'cover' }} />
            </Section>
          )}

          {/* Subject as article title */}
          <Section style={{ backgroundColor: '#fff', padding: '36px 40px 8px' }}>
            <Heading style={{ fontSize: 24, color: '#111', margin: '0 0 16px', fontWeight: 700, lineHeight: 1.3 }}>
              {subject}
            </Heading>
            <Hr style={{ borderColor: '#eee', margin: '0 0 24px' }} />
          </Section>

          {/* Body — rich HTML or plain paragraphs */}
          <Section style={{ backgroundColor: '#fff', padding: '0 40px 40px', borderRadius: '0 0 12px 12px' }}>
            {bodyHtml
              ? <div className="nl-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              : (body || '').split('\n').filter(Boolean).map((para, i) => (
                  <Text key={i} style={{ fontSize: 16, color: '#333', lineHeight: 1.8, margin: '0 0 18px' }}>
                    {para}
                  </Text>
                ))
            }

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
