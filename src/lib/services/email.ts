// Servicio de email abstraído.
// Modo "dev" (default): registra en consola (no envía).
// Modo "resend": requiere RESEND_API_KEY y envía via Resend.
// Para producción, configura EMAIL_PROVIDER=resend y RESEND_API_KEY.

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
// Carga `resend` dinámicamente en runtime para no romper el build si el
// paquete no está instalado (es una dependencia opcional).
async function loadResendSdk(): Promise<any | null> {
  try {
    const runtimeRequire = eval('require') as NodeRequire
    const mod = runtimeRequire('resend')
    return mod.Resend || mod.default || mod
  } catch {
    return null
  }
}

const ResendProvider: EmailProvider = {
  async send(msg) {
    try {
      const Resend = await loadResendSdk()
      if (!Resend) throw new Error('Resend SDK no disponible. Instala "resend" y configura RESEND_API_KEY.')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const to = Array.isArray(msg.to) ? msg.to : [msg.to]
      const res = await resend.emails.send({
        from: msg.from || process.env.EMAIL_FROM || 'Dimarclub <no-reply@dimarclub.com>',
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
      return { success: false, provider: 'resend', error: (e as Error).message }
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
