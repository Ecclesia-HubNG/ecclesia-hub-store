import { Resend } from 'resend'
import { render } from '@react-email/components'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

import OrderConfirmation, { type OrderConfirmationProps } from '@/emails/OrderConfirmation'
import OrderShipped, { type OrderShippedProps } from '@/emails/OrderShipped'
import WelcomeEmail, { type WelcomeEmailProps } from '@/emails/WelcomeEmail'
import PromoEmail, { type PromoEmailProps } from '@/emails/PromoEmail'
import NewsletterEmail, { type NewsletterEmailProps } from '@/emails/NewsletterEmail'
import InviteEmail, { type InviteEmailProps } from '@/emails/InviteEmail'
import PasswordResetEmail, { type PasswordResetEmailProps } from '@/emails/PasswordResetEmail'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'no-reply@ecclesiahub.store'

async function logEmail(type: string, to: string | string[], subject: string, status: 'sent' | 'failed', error?: string, metadata?: Record<string, unknown>) {
  try {
    const supabase = createAdminClient()
    const { error: dbErr } = await supabase.from('email_logs').insert({
      type,
      to_email: Array.isArray(to) ? to.join(', ') : to,
      subject,
      status,
      error: error ?? null,
      metadata: metadata ?? null,
    })
    if (dbErr) console.error('[email-log] insert failed:', dbErr.message, dbErr.code)
  } catch (err) {
    console.error('[email-log] unexpected error:', err)
  }
}

export async function sendOrderConfirmation(to: string, props: OrderConfirmationProps) {
  const subject = `Order Confirmed — #${props.orderNumber}`
  try {
    const html = await render(createElement(OrderConfirmation, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('order_confirmation', to, subject, 'sent', undefined, { orderId: props.orderNumber })
  } catch (err: any) {
    await logEmail('order_confirmation', to, subject, 'failed', err?.message)
    throw err
  }
}

export async function sendOrderShipped(to: string, props: OrderShippedProps) {
  const subject = `Your order #${props.orderNumber} has shipped!`
  try {
    const html = await render(createElement(OrderShipped, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('order_shipped', to, subject, 'sent', undefined, { orderId: props.orderNumber })
  } catch (err: any) {
    await logEmail('order_shipped', to, subject, 'failed', err?.message)
    throw err
  }
}

export async function sendWelcomeEmail(to: string, props: WelcomeEmailProps) {
  const subject = 'Welcome to Ecclesia Hub!'
  try {
    const html = await render(createElement(WelcomeEmail, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('welcome', to, subject, 'sent')
  } catch (err: any) {
    await logEmail('welcome', to, subject, 'failed', err?.message)
    throw err
  }
}

export async function sendPromoEmail(recipients: string[], props: PromoEmailProps) {
  const subject = props.subject
  let sent = 0, failed = 0
  // Resend allows up to 50 recipients per batch call
  const chunks = chunkArray(recipients, 50)
  for (const chunk of chunks) {
    try {
      const html = await render(createElement(PromoEmail, props))
      await resend.emails.send({ from: FROM, to: chunk, subject, html })
      sent += chunk.length
    } catch (err: any) {
      failed += chunk.length
      await logEmail('promo', chunk, subject, 'failed', err?.message)
    }
  }
  if (sent > 0) await logEmail('promo', `${sent} recipients`, subject, 'sent', undefined, { total: recipients.length, sent, failed })
  return { sent, failed }
}

export async function sendNewsletter(recipients: string[], props: NewsletterEmailProps) {
  const subject = props.subject
  let sent = 0, failed = 0
  const chunks = chunkArray(recipients, 50)
  for (const chunk of chunks) {
    try {
      const html = await render(createElement(NewsletterEmail, props))
      await resend.emails.send({ from: FROM, to: chunk, subject, html })
      sent += chunk.length
    } catch (err: any) {
      failed += chunk.length
      await logEmail('newsletter', chunk, subject, 'failed', err?.message)
    }
  }
  if (sent > 0) await logEmail('newsletter', `${sent} recipients`, subject, 'sent', undefined, { total: recipients.length, sent, failed })
  return { sent, failed }
}

export async function sendStaffInvite(to: string, props: InviteEmailProps) {
  const subject = `You've been invited to Ecclesia Hub as ${props.roleLabel}`
  try {
    const html = await render(createElement(InviteEmail, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('staff_invite', to, subject, 'sent', undefined, { role: props.roleLabel })
  } catch (err: any) {
    await logEmail('staff_invite', to, subject, 'failed', err?.message)
    throw err
  }
}

export async function sendPasswordResetEmail(to: string, props: PasswordResetEmailProps) {
  const subject = 'Reset your Ecclesia Hub password'
  try {
    const html = await render(createElement(PasswordResetEmail, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('password_reset', to, subject, 'sent')
  } catch (err: any) {
    await logEmail('password_reset', to, subject, 'failed', err?.message)
    throw err
  }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}
