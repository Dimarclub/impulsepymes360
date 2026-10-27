// Parser de mensajes de WhatsApp para Fuerza Delta
// Convierte texto natural en datos estructurados de solicitud de envío

export interface ParsedShipment {
  senderName?: string
  senderPhone?: string
  senderAddress?: string
  recipientName?: string
  recipientPhone?: string
  recipientAddress?: string
  recipientReference?: string
  city?: string
  packageDescription?: string
  confidence: number // 0-1
  rawFields: Record<string, string>
}

const FIELD_PATTERNS: Record<string, RegExp[]> = {
  senderName: [/^de:\s*(.+)$/im, /^remitente:\s*(.+)$/im, /^nombre del remitente:\s*(.+)$/im],
  senderPhone: [/^tel:?\s*(.+)$/im, /^tel[eé]fono:?\s*(.+)$/im, /^celular:?\s*(.+)$/im, /^cel:?\s*(.+)$/im],
  senderAddress: [/^dir:?\s*(.+)$/im, /^direcci[oó]n:?\s*(.+)$/im, /^origen:?\s*(.+)$/im],
  recipientName: [/^para:\s*(.+)$/im, /^destinatario:\s*(.+)$/im, /^nombre del destinatario:\s*(.+)$/im],
  recipientPhone: [/^tel[eé]fono destino:?\s*(.+)$/im, /^tel destino:?\s*(.+)$/im],
  recipientAddress: [/^dir destino:?\s*(.+)$/im, /^direcci[oó]n destino:?\s*(.+)$/im, /^destino:?\s*(.+)$/im],
  recipientReference: [/^referencia:?\s*(.+)$/im, /^ref:?\s*(.+)$/im, /^indicaci[oó]n:?\s*(.+)$/im],
  city: [/^ciudad:?\s*(.+)$/im],
  packageDescription: [/^paquete:?\s*(.+)$/im, /^descripci[oó]n:?\s*(.+)$/im, /^producto:?\s*(.+)$/im],
}

export function parseShipmentMessage(text: string): ParsedShipment {
  const result: ParsedShipment = { confidence: 0, rawFields: {} }

  // Detectar si es una solicitud de envío
  const isShipmentRequest = /^(env[ií]o|enviar|solicitar|delivery|pedido)/im.test(text.trim())

  // Extraer campos con patrones
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        const value = match[1].trim()
        ;(result as Record<string, unknown>)[field] = value
        result.rawFields[field] = value
        break
      }
    }
  }

  // Lógica secundaria: si hay "Para:" pero no "Tel destino:", el segundo "Tel:" es del destino
  const allTelMatches = [...text.matchAll(/^tel:?\s*(.+)$/gim)]
  if (allTelMatches.length >= 2 && !result.recipientPhone) {
    result.recipientPhone = allTelMatches[1][1].trim()
    result.rawFields.recipientPhone = result.recipientPhone
  }

  // Lógica secundaria: segundo "Dir:" o "Dirección:" es del destino
  const allDirMatches = [...text.matchAll(/^(dir|direcci[oó]n):?\s*(.+)$/gim)]
  if (allDirMatches.length >= 2 && !result.recipientAddress) {
    result.recipientAddress = allDirMatches[1][2].trim()
    result.rawFields.recipientAddress = result.recipientAddress
  }

  // Calcular confianza
  const requiredFields = ['senderName', 'senderPhone', 'recipientName', 'recipientPhone', 'recipientAddress']
  const found = requiredFields.filter((f) => (result as Record<string, unknown>)[f]).length
  result.confidence = found / requiredFields.length

  // Si no parece solicitud de envío, bajar confianza
  if (!isShipmentRequest) result.confidence *= 0.3

  return result
}

// Detectar la plantilla a usar según el mensaje
export function detectTemplate(message: string): string | null {
  const lower = message.toLowerCase().trim()
  if (lower === 'hola' || lower.startsWith('hola')) return 'hola'
  if (lower.includes('ayuda') || lower === 'help') return 'ayuda'
  if (lower.includes('precio') || lower.includes('tarifa') || lower.includes('costo')) return 'precio'
  if (lower.includes('agente') || lower.includes('humano') || lower.includes('operador')) return 'agente'
  if (lower.startsWith('estado')) return 'estado'
  return null
}

// Calcular precio estimado según vehículo y tipo de servicio
export function estimatePrice(vehicleType: string, serviceType: string = 'STANDARD'): number {
  const basePrices: Record<string, number> = {
    BICYCLE: 2, MOTORCYCLE: 3, PICKUP: 8, TRUCK: 15, TRACTOR_TRUCK: 25, TAXI: 4,
  }
  const serviceMultipliers: Record<string, number> = {
    STANDARD: 1, EXPRESS: 1.5, SAME_DAY: 1.3,
  }
  const base = basePrices[vehicleType] || 3
  const mult = serviceMultipliers[serviceType] || 1
  return +(base * mult).toFixed(2)
}

// Determinar vehículo requerido según peso/tamaño
export function suggestVehicle(weight?: number, size?: string): string {
  if (weight && weight > 20) return 'TRUCK'
  if (weight && weight > 5) return 'PICKUP'
  if (size === 'grande') return 'PICKUP'
  return 'MOTORCYCLE'
}

// Generar respuesta del bot
export function generateBotResponse(parsed: ParsedShipment, shipmentId?: string): string {
  if (parsed.confidence < 0.6) {
    return '🤔 No pude entender todos los datos del envío. Por favor envía:\n\n*ENVIO*\nDe: [tu nombre]\nTel: [tu teléfono]\nDir: [dirección]\nPara: [destinatario]\nTel: [teléfono]\nDir: [dirección de entrega]\nReferencia: [referencia]\n\nO escribe *ayuda* para ver más opciones.'
  }
  const vehicle = suggestVehicle(undefined, undefined)
  const price = estimatePrice(vehicle)
  return `✅ ¡Solicitud de envío recibida${shipmentId ? `!` : '!'}

📦 ${shipmentId ? `Pedido #${shipmentId}` : 'Procesando...'}
📍 De: ${parsed.senderName} → ${parsed.recipientName}
🛵 ${vehicle === 'MOTORCYCLE' ? 'Moto' : vehicle} · $${price.toFixed(2)}
⏱ Estimado: 45 min

Un mensajero será asignado pronto. Te avisaremos cuando salga.`
}
