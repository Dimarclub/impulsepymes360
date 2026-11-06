import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/security/auth'

/**
 * POST /api/bandeja/simulate
 * Crea mensajes simulados entrantes para demo.
 * Body opcional: { count }
 * Genera entre 5 y 8 mensajes aleatorios de distintos canales con
 * nombres ecuatorianos realistas.
 */
const EC_NAMES = [
  'María Fernanda Cárdenas',
  'José Luis Pinto',
  'Carla Michelle Veintimilla',
  'Andrés Sebastián Torres',
  'Sofía Valentina Mendoza',
  'Diego Alejandro Ramírez',
  'Valeria Nicole Salazar',
  'Mateo Andrés Castillo',
  'Gabriela Alejandra Ruiz',
  'Santiago Emilio Hurtado',
  'Camila Daniela Ortiz',
  'Bruno Esteban Quiroga',
]

const EC_HANDLES = [
  '+593 99 123 4567',
  '+593 98 765 4321',
  '@maria.cardenas',
  '@josepinto_ec',
  '@carla.veintimilla',
  'andy_torres',
  'sofi.mendoza',
  'diego.ramirez',
  '@valeria.salazar',
  'mateo.castillo',
]

const SUBJECTS_EMAIL = [
  'Cotización de productos',
  'Consulta sobre disponibilidad',
  'Solicitud de reunión',
  'Información de envíos',
  'Gracias por la atención',
  'Reclamo por factura',
]

const BODIES: Record<string, string[]> = {
  WHATSAPP: [
    'Hola, vi su publicación en Instagram y me interesa el producto. ¿Tienen stock?',
    'Buenas tardes, ¿pueden enviarme el catálogo por favor?',
    'Cuál es el precio al por mayor? Necesito 50 unidades.',
    'Ya realicé la transferencia, les adjunto el comprobante.',
    'Hola! Vi que tienen envío a Manta, ¿cuánto tarda?',
  ],
  INSTAGRAM: [
    'Me encantó el último post! ¿Dónde puedo comprar?',
    'Hacen envíos a Cuenca? 💕',
    'Quiero agendar una sesión para la próxima semana',
    'Tienen talla XL disponible?',
    'Su link en bio no funciona, pueden ayudarme?',
  ],
  FACEBOOK: [
    'Vi su página y me gustaría más información sobre los planes.',
    'Buenos días, tengo una consulta sobre la promoción de la semana.',
    'Puedo pasar a recoger el pedido hoy mismo?',
    'Tienen punto de venta con tarjeta?',
  ],
  TIKTOK: [
    'Ví su video y quiero uno igual! 🎉',
    'Cómo hago el pedido? Soy de Guayaquil',
    'Hacen descuento por la primera compra?',
  ],
  EMAIL: [
    'Estimados, les escribo para solicitar una cotización formal de los productos vistos en su marketplace. Necesito factura y entrega en Quito.',
    'Hola, adjunto el RUC para la factura electrónica. Por favor confirmen recepción.',
    'Quisiera reagendar la reunión de mañana para el viernes si es posible.',
  ],
  SMS: [
    'Su pedido está listo para retirar. Horario 9-18h.',
    'Cod: 4821. No comparta este código con nadie.',
    'Recordatorio: su cita es mañana 10am.',
  ],
  PHONE: [
    'Llamada perdida — devolver ASAP',
    'Llamada entrante 5min. Solicita cotización.',
    'Devolución de llamada solicitada para las 3pm.',
  ],
}

const CHANNELS = Object.keys(BODIES)

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST(req: NextRequest) {
  const auth = await requireRole('SUPPLIER', 'ADMIN')
  if (auth instanceof NextResponse) return auth

  const body = await req.json().catch(() => ({}))
  const count = Math.max(3, Math.min(12, Number(body?.count) || (5 + Math.floor(Math.random() * 4))))

  const messages = []
  for (let i = 0; i < count; i++) {
    const channel = pick(CHANNELS)
    const fromName = pick(EC_NAMES)
    const fromHandle = channel === 'EMAIL'
      ? `${fromName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`
      : pick(EC_HANDLES)
    const subject = channel === 'EMAIL' ? pick(SUBJECTS_EMAIL) : null
    const text = pick(BODIES[channel])
    // Distribuye timestamps en las últimas 24h
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))
    const status = Math.random() < 0.55 ? 'UNREAD' : 'READ'

    const m = await db.unifiedMessage.create({
      data: {
        userId: auth.id,
        channel,
        fromName,
        fromHandle,
        toName: auth.name || null,
        subject,
        body: text,
        isOutgoing: false,
        status,
      },
    })
    // Ajustamos el createdAt manualmente para realismo (prisma no permite en create)
    await db.unifiedMessage.update({ where: { id: m.id }, data: { createdAt } })
    messages.push(m)
  }

  return NextResponse.json({ ok: true, count: messages.length })
}
