import { Resend } from 'resend'
import { render } from '@react-email/components'
import { createElement } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'

import OrderConfirmation, { type OrderConfirmationProps } from '@/emails/OrderConfirmation'
import OrderProcessingEmail, { type OrderProcessingEmailProps } from '@/emails/OrderProcessingEmail'
import PaymentFailedEmail, { type PaymentFailedEmailProps } from '@/emails/PaymentFailedEmail'
import AdminOrderNotificationEmail, { type AdminOrderNotificationEmailProps } from '@/emails/AdminOrderNotificationEmail'
import OrderShipped, { type OrderShippedProps } from '@/emails/OrderShipped'
import WelcomeEmail, { type WelcomeEmailProps } from '@/emails/WelcomeEmail'
import PromoEmail, { type PromoEmailProps } from '@/emails/PromoEmail'
import NewsletterEmail, { type NewsletterEmailProps } from '@/emails/NewsletterEmail'
import NewsletterWelcomeEmail, { type NewsletterWelcomeEmailProps } from '@/emails/NewsletterWelcomeEmail'
import InviteEmail, { type InviteEmailProps } from '@/emails/InviteEmail'
import PasswordResetEmail, { type PasswordResetEmailProps } from '@/emails/PasswordResetEmail'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.FROM_EMAIL ?? 'Ecclesia Hub <no-reply@ecclesiahub.store>'

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

export async function sendOrderProcessing(to: string, props: OrderProcessingEmailProps) {
  const subject = `Payment received — Order #${props.orderNumber} is processing`
  try {
    const html = await render(createElement(OrderProcessingEmail, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('order_processing', to, subject, 'sent', undefined, { orderId: props.orderNumber })
  } catch (err: any) {
    await logEmail('order_processing', to, subject, 'failed', err?.message)
    throw err
  }
}

export async function sendPaymentFailed(to: string, props: PaymentFailedEmailProps) {
  const subject = `Payment failed — Order #${props.orderNumber}`
  try {
    const html = await render(createElement(PaymentFailedEmail, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('payment_failed', to, subject, 'sent', undefined, { orderNumber: props.orderNumber })
  } catch (err: any) {
    await logEmail('payment_failed', to, subject, 'failed', err?.message)
    throw err
  }
}

export async function sendAdminOrderNotification(props: AdminOrderNotificationEmailProps) {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!adminEmail) return
  const subject = props.event === 'payment_confirmed'
    ? `Payment confirmed — Order #${props.orderNumber} · ₦${props.total.toLocaleString('en')}`
    : `New order — #${props.orderNumber} · ₦${props.total.toLocaleString('en')}`
  try {
    const html = await render(createElement(AdminOrderNotificationEmail, props))
    await resend.emails.send({ from: FROM, to: adminEmail, subject, html })
  } catch (err: any) {
    console.error('[admin-notification] email failed:', err?.message)
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
  const html = await render(createElement(PromoEmail, props))
  // Resend batch.send allows up to 100 individual messages per call — each
  // recipient gets their own email so no one sees the others' addresses.
  const chunks = chunkArray(recipients, 100)
  for (const chunk of chunks) {
    try {
      await resend.batch.send(chunk.map(to => ({ from: FROM, to, subject, html })))
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
  const html = await render(createElement(NewsletterEmail, props))
  // Resend batch.send allows up to 100 individual messages per call — each
  // recipient gets their own email so no one sees the others' addresses.
  const chunks = chunkArray(recipients, 100)
  for (const chunk of chunks) {
    try {
      await resend.batch.send(chunk.map(to => ({ from: FROM, to, subject, html })))
      sent += chunk.length
    } catch (err: any) {
      failed += chunk.length
      await logEmail('newsletter', chunk, subject, 'failed', err?.message)
    }
  }
  if (sent > 0) await logEmail('newsletter', `${sent} recipients`, subject, 'sent', undefined, { total: recipients.length, sent, failed })
  return { sent, failed }
}

export async function sendNewsletterWelcomeEmail(to: string, props: NewsletterWelcomeEmailProps) {
  const subject = `Here's your ${props.discountPercent ?? 15}% off code`
  try {
    const html = await render(createElement(NewsletterWelcomeEmail, props))
    await resend.emails.send({ from: FROM, to, subject, html })
    await logEmail('newsletter_welcome', to, subject, 'sent')
  } catch (err: any) {
    await logEmail('newsletter_welcome', to, subject, 'failed', err?.message)
    throw err
  }
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
