// Servicio de email abstraído.
// Modo "dev" (default): registra en consola (no envía).
// Modo "resend": requiere RESEND_API_KEY y envía via Resend.
// Para producción, configura EMAIL_PROVIDER=resend y RESEND_API_KEY.

import { Resend } from 'resend'

export interface EmailMessage {
  to: string | string[]
  from?: string
  subject: string
  html: string
  text?: string
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  provider: string
  error?: string
}

interface EmailProvider {
  send(msg: EmailMessage): Promise<EmailSendResult>
}

// ---------- Dev Provider (logs a consola) ----------
const DevProvider: EmailProvider = {
  async send(msg) {
    const recipients = Array.isArray(msg.to) ? msg.to.join(', ') : msg.to
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 [DEV EMAIL] (no enviado realmente)')
    console.log(`   Para: ${recipients}`)
    console.log(`   De:  ${msg.from || process.env.EMAIL_FROM}`)
    console.log(`   Asunto: ${msg.subject}`)
    console.log('   ─────────────────────────────────────')
    console.log(msg.text || msg.html.replace(/<[^>]+>/g, '').slice(0, 200))
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    return { success: true, messageId: 'dev_' + Date.now(), provider: 'dev' }
  },
}

// ---------- Resend Provider (real) ----------
const ResendProvider: EmailProvider = {
  async send(msg) {
    try {
      if (!process.env.RESEND_API_KEY) {
        throw new Error('Falta RESEND_API_KEY en las variables de entorno')
      }
      const resend = new Resend(process.env.RESEND_API_KEY)
      const to = Array.isArray(msg.to) ? msg.to : [msg.to]
      const from = msg.from || process.env.EMAIL_FROM || 'Dimarclub <no-reply@dimarclub.com>'
      const res = await resend.emails.send({
        from,
        to,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
      })
      if (res.error) {
        return { success: false, provider: 'resend', error: res.error.message }
      }
      return { success: true, messageId: res.data?.id, provider: 'resend' }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      console.error('[email] resend send error:', errMsg)
      return { success: false, provider: 'resend', error: errMsg }
    }
  },
}

export function getEmailProvider(): EmailProvider {
  const provider = process.env.EMAIL_PROVIDER || 'dev'
  if (provider === 'resend' && process.env.RESEND_API_KEY) {
    return ResendProvider
  }
  return DevProvider
}

export const EMAIL_PROVIDER_NAME = process.env.EMAIL_PROVIDER === 'resend' ? 'resend' : 'dev'
