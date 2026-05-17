import {
  Html, Head, Body, Container, Section,
  Heading, Text, Button, Hr, Preview, Link,
} from '@react-email/components'

export type PasswordResetEmailProps = {
  name?: string
  email: string
  resetLink: string
}

const brand = '#4A0F1C'

export default function PasswordResetEmail({
  name = 'there',
  email = 'user@example.com',
  resetLink = 'https://ecclesiahub.store',
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your Ecclesia Hub password</Preview>
      <Body style={{ backgroundColor: '#f6f6f6', fontFamily: 'Arial, sans-serif', margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '40px 20px' }}>

          <Section style={{ backgroundColor: brand, borderRadius: '12px 12px 0 0', padding: '40px', textAlign: 'center' }}>
            <Heading style={{ color: '#fff', fontSize: 28, margin: '0 0 8px', fontWeight: 700 }}>
              Ecclesia Hub
            </Heading>
            <Text style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: 15 }}>
              Password Reset
            </Text>
          </Section>

          <Section style={{ backgroundColor: '#fff', padding: '44px 40px', borderRadius: '0 0 12px 12px' }}>
            <Heading style={{ fontSize: 20, color: '#111', margin: '0 0 16px' }}>
              Reset your password, {name}
            </Heading>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: 1.7, margin: '0 0 12px' }}>
              We received a request to reset the password for your Ecclesia Hub admin account.
            </Text>
            <Text style={{ color: '#555', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px' }}>
              Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
            </Text>

            <Button
              href={resetLink}
              style={{ backgroundColor: brand, color: '#fff', borderRadius: 8, padding: '14px 32px', fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}
            >
              Reset Password →
            </Button>

            <Hr style={{ borderColor: '#eee', margin: '12px 0 28px' }} />

            <Text style={{ color: '#aaa', fontSize: 13, margin: '0 0 4px' }}>
              If you didn't request a password reset, please ignore this email. Your password will not be changed.
            </Text>
            <Text style={{ color: '#aaa', fontSize: 12, margin: 0 }}>
              This was sent to {email} ·{' '}
              <Link href="mailto:hello@ecclesiahub.store" style={{ color: '#6B1A2A' }}>hello@ecclesiahub.store</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
