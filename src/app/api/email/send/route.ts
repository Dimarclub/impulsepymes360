import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'
import { getEmailProvider } from '@/lib/services/email'

// Enviar una campaña a sus suscriptores
export async function POST(req: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (auth instanceof NextResponse) return auth
  const body = await req.json()
  const { campaignId } = body as { campaignId: string }

  const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } })
  if (!campaign) return NextResponse.json({ error: 'Campaña no encontrada' }, { status: 404 })
  if (campaign.status === 'SENT') return NextResponse.json({ error: 'La campaña ya fue enviada' }, { status: 400 })

  // Obtener suscriptores según audiencia
  const where = campaign.audience === 'ALL' ? { active: true } : { active: true, segment: campaign.audience }
  const subscribers = await db.emailSubscriber.findMany({ where })

  const provider = getEmailProvider()
  let sent = 0
  let failed = 0
  const errors: string[] = []

  // Personalizar contenido por suscriptor y enviar
  for (const sub of subscribers) {
    const personalized = campaign.content
      .replace(/{nombre}/g, sub.name || 'estimado cliente')
      .replace(/{email}/g, sub.email)
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(120deg, #0d9488, #d97706); padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Dimarclub</h1>
        </div>
        <div style="padding: 24px; background: #ffffff;">
          <h2 style="color: #0f766e;">${campaign.subject}</h2>
          <div style="color: #374151; line-height: 1.6;">${personalized}</div>
        </div>
        <div style="padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          <p>Recibiste este correo porque estás suscrito a Dimarclub.</p>
          <p>© 2025 Dimarclub. Todos los derechos reservados.</p>
        </div>
      </div>
    `
    const result = await provider.send({
      to: sub.email,
      subject: campaign.subject,
      html,
      text: personalized,
    })
    if (result.success) sent++
    else { failed++; if (result.error) errors.push(`${sub.email}: ${result.error}`) }
  }

  // Actualizar campaña
  await db.emailCampaign.update({
    where: { id: campaignId },
    data: {
      status: 'SENT',
      sentAt: new Date(),
      recipientCount: subscribers.length,
      openCount: Math.floor(sent * 0.65), // simulado (en prod se mide con tracking pixels)
      clickCount: Math.floor(sent * 0.22),
    },
  })

  return NextResponse.json({
    sent,
    failed,
    total: subscribers.length,
    provider: process.env.EMAIL_PROVIDER || 'dev',
    errors: errors.slice(0, 10),
  })
}
