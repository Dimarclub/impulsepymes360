import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseShipmentMessage, detectTemplate, generateBotResponse, suggestVehicle, estimatePrice } from '@/lib/services/whatsapp-parser'

// Webhook de WhatsApp Business API (Meta)
// Meta envía: POST con { entry: [{ changes: [{ value: { messages: [{ from, text { body } }] } }] }] }
// Verificación GET con hub.mode=subscribe, hub.verify_token, hub.challenge
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'dimarclub_webhook_2025'
  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Extraer mensaje de la estructura de Meta
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true, ignored: true })
    }
    const msg = messages[0]
    const fromPhone = msg.from
    const fromName = body?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name || fromPhone
    const messageBody = msg.text?.body || msg.type || ''

    return await processIncomingMessage(fromPhone, fromName, messageBody)
  } catch (e) {
    console.error('Webhook error:', (e as Error).message)
    return NextResponse.json({ error: 'processing failed' }, { status: 500 })
  }
}

// Procesar mensaje entrante (usado por webhook y simulador)
export async function processIncomingMessage(fromPhone: string, fromName: string, messageBody: string) {
  // Guardar el mensaje
  const waMessage = await db.whatsAppMessage.create({
    data: { fromPhone, fromName, messageBody, messageType: 'TEXT', status: 'RECEIVED' },
  })

  // Detectar si es comando de plantilla
  const templateTrigger = detectTemplate(messageBody)
  if (templateTrigger) {
    const template = await db.whatsAppTemplate.findFirst({ where: { trigger: templateTrigger, active: true } })
    if (template) {
      await db.whatsAppMessage.update({
        where: { id: waMessage.id },
        data: { botResponse: template.content, status: 'PROCESSED' },
      })
      return NextResponse.json({ ok: true, response: template.content, messageId: waMessage.id })
    }
  }

  // Intentar parsear como solicitud de envío
  const parsed = parseShipmentMessage(messageBody)
  if (parsed.confidence >= 0.6) {
    // Buscar provider por teléfono
    const provider = await db.provider.findFirst({ where: { phone: fromPhone } })
    const vehicle = suggestVehicle(undefined, undefined)
    const price = estimatePrice(vehicle)
    // Crear solicitud de envío
    const shipment = await db.shipmentRequest.create({
      data: {
        providerId: provider?.id || null,
        senderName: parsed.senderName || fromName,
        senderPhone: parsed.senderPhone || fromPhone,
        senderAddress: parsed.senderAddress || '',
        recipientName: parsed.recipientName || '',
        recipientPhone: parsed.recipientPhone || '',
        recipientAddress: parsed.recipientAddress || '',
        recipientReference: parsed.recipientReference || null,
        city: parsed.city || 'Guayaquil',
        packageDescription: parsed.packageDescription || null,
        vehicleRequired: vehicle,
        estimatedPrice: price,
        status: 'PENDING',
        source: 'WHATSAPP',
        whatsappMessageId: waMessage.id,
      },
    })
    const botResponse = generateBotResponse(parsed, shipment.id.slice(-6).toUpperCase())
    await db.whatsAppMessage.update({
      where: { id: waMessage.id },
      data: {
        parsed: true,
        parsedData: JSON.stringify(parsed.rawFields),
        shipmentRequestId: shipment.id,
        botResponse,
        status: 'PROCESSED',
      },
    })
    return NextResponse.json({ ok: true, shipmentId: shipment.id, response: botResponse, messageId: waMessage.id })
  }

  // Mensaje no reconocido
  const fallbackResponse = '🤔 No reconocí tu mensaje. Escribe *hola* para ver las opciones o *ayuda* para ver los comandos.'
  await db.whatsAppMessage.update({
    where: { id: waMessage.id },
    data: { botResponse: fallbackResponse, status: 'IGNORED' },
  })
  return NextResponse.json({ ok: true, response: fallbackResponse, messageId: waMessage.id })
}
