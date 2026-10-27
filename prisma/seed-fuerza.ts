/* Fuerza Delta - Seed de plantillas WhatsApp + solicitudes de envío */
import { db } from '../src/lib/db'

async function main() {
  console.log('🌱 Iniciando seed Fuerza Delta...')

  // Limpiar
  await db.whatsAppMessage.deleteMany()
  await db.whatsAppTemplate.deleteMany()
  await db.shipmentRequest.deleteMany()

  // ---------- Plantillas WhatsApp ----------
  const templates = [
    {
      name: 'Bienvenida',
      trigger: 'hola',
      content: '👋 ¡Hola! Soy el bot de Fuerza Delta.\n\nPara solicitar un envío, envía:\n\n*ENVIO*\nDe: [tu nombre]\nTel: [tu teléfono]\nDir: [dirección de recolección]\n\nPara: [nombre destinatario]\nTel: [teléfono]\nDir: [dirección de entrega]\nReferencia: [referencia]\n\nEjemplo:\nENVIO\nDe: Juan Pérez\nTel: 099111222\nDir: Av. 9 de Octubre\nPara: María Gómez\nTel: 099333444\nDir: Urdesa Central 321\nReferencia: casa esquinera azul',
      description: 'Mensaje de bienvenida con instrucciones',
    },
    {
      name: 'Ayuda',
      trigger: 'ayuda',
      content: '🆘 *Comandos disponibles:*\n\n• `hola` - Ver instrucciones\n• `ayuda` - Esta lista\n• `ENVIO ...` - Solicitar un envío\n• `estado` - Ver estado de tus envíos\n• `precio` - Ver tarifas\n\n¿Necesitas hablar con un humano? Escribe *agente*',
      description: 'Lista de comandos',
    },
    {
      name: 'Tarifas',
      trigger: 'precio',
      content: '💰 *Tarifas Fuerza Delta:*\n\n🛵 Moto (hasta 5kg): $3.00\n🚲 Bicicleta (hasta 3kg): $2.00\n🚙 Camioneta (hasta 50kg): $8.00\n🚛 Camión: $15.00+\n\n⚡ Express (2h): +50%\n📅 Same day (hoy): +30%\n\nEnvía *ENVIO* con los datos para crear una solicitud.',
      description: 'Lista de tarifas',
    },
    {
      name: 'Agente humano',
      trigger: 'agente',
      content: '👨‍💼 Un agente humano te atenderá pronto. Horario: Lun-Vie 9-18, Sáb 9-14.\n\nO llama al 042-222333 (Fuerza Delta central).',
      description: 'Derivación a agente humano',
    },
  ]
  for (const t of templates) {
    await db.whatsAppTemplate.create({ data: t })
  }
  console.log(`✓ ${templates.length} plantillas WhatsApp creadas`)

  // ---------- Solicitudes de envío ----------
  const provider = await db.provider.findFirst()
  const courier = await db.courier.findFirst()

  const shipments = [
    {
      senderName: 'TecnoExpress', senderPhone: '042222333', senderAddress: 'Av. 9 de Octubre y Boyacá',
      recipientName: 'Carlos Mendoza', recipientPhone: '099123456', recipientAddress: 'Urdesa Central 321',
      recipientReference: 'Casa esquinera azul, 2 pisos', city: 'Guayaquil',
      packageDescription: 'Smartphone Galaxy A55', packageWeight: 0.5, packageSize: 'pequeño',
      serviceType: 'STANDARD', vehicleRequired: 'MOTORCYCLE', estimatedPrice: 3,
      status: 'PENDING', source: 'WEB', providerId: provider?.id,
    },
    {
      senderName: 'TecnoExpress', senderPhone: '042222333', senderAddress: 'Av. 9 de Octubre y Boyacá',
      recipientName: 'Patricia Salazar', recipientPhone: '098765432', recipientAddress: 'Samborondón 5',
      recipientReference: 'Frente al parque', city: 'Guayaquil',
      packageDescription: 'Laptop HP Pavilion', packageWeight: 2.5, packageSize: 'mediano',
      serviceType: 'EXPRESS', vehicleRequired: 'MOTORCYCLE', estimatedPrice: 4.5,
      status: 'ASSIGNED', source: 'WHATSAPP', providerId: provider?.id, courierId: courier?.id,
      assignedAt: new Date(Date.now() - 3600000),
    },
    {
      senderName: 'TecnoExpress', senderPhone: '042222333', senderAddress: 'Av. 9 de Octubre y Boyacá',
      recipientName: 'Luis Torres', recipientPhone: '099555666', recipientAddress: 'Centro Comercial Mall del Sol',
      recipientReference: 'Tienda #45', city: 'Guayaquil',
      packageDescription: 'Audífonos JBL + Cargador', packageWeight: 1, packageSize: 'pequeño',
      serviceType: 'SAME_DAY', vehicleRequired: 'MOTORCYCLE', estimatedPrice: 3.9, finalPrice: 3.9,
      status: 'DELIVERED', source: 'WEB', providerId: provider?.id, courierId: courier?.id,
      assignedAt: new Date(Date.now() - 7200000),
      pickedUpAt: new Date(Date.now() - 5400000),
      deliveredAt: new Date(Date.now() - 1800000),
    },
    {
      senderName: 'TecnoExpress', senderPhone: '042222333', senderAddress: 'Av. 9 de Octubre y Boyacá',
      recipientName: 'María Vera', recipientPhone: '099777888', recipientAddress: 'Via a Daule km 8.5',
      recipientReference: 'Fábrica Dimar', city: 'Daule',
      packageDescription: 'Mesa comedor (armada)', packageWeight: 25, packageSize: 'grande',
      serviceType: 'STANDARD', vehicleRequired: 'TRUCK', estimatedPrice: 15,
      status: 'PENDING', source: 'WEB', providerId: provider?.id,
    },
  ]
  for (const s of shipments) {
    await db.shipmentRequest.create({ data: s })
  }
  console.log(`✓ ${shipments.length} solicitudes de envío creadas`)

  // ---------- Mensaje WhatsApp de ejemplo (procesado) ----------
  await db.whatsAppMessage.create({
    data: {
      fromPhone: '042222333', fromName: 'TecnoExpress',
      messageBody: 'ENVIO\nDe: TecnoExpress\nTel: 042222333\nDir: Av. 9 de Octubre\nPara: Carlos Mendoza\nTel: 099123456\nDir: Urdesa Central 321\nReferencia: casa esquinera azul',
      messageType: 'TEXT',
      parsed: true,
      parsedData: JSON.stringify({ senderName: 'TecnoExpress', senderPhone: '042222333', recipientName: 'Carlos Mendoza', recipientPhone: '099123456' }),
      botResponse: '✅ ¡Solicitud de envío recibida!\n\n📦 Pedido #FD-001\n📍 De: TecnoExpress → Carlos Mendoza\n🛵 Moto · $3.00\n⏱ Estimado: 45 min\n\nUn mensajero será asignado pronto. Te avisaremos.',
      status: 'PROCESSED',
    },
  })
  console.log('✓ Mensaje WhatsApp de ejemplo creado')

  console.log('🎉 Seed Fuerza Delta completado.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
