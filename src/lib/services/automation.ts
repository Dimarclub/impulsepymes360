// Servicio de automatización cruzada de ImpulsePymes360
// Cuando ocurre un evento (producto publicado, orden creada, etc.),
// este servicio propaga la acción a todos los sistemas relevantes.

import { db } from '@/lib/db'
import { generateProductPost } from './ai-content'

export interface AutomationEvent {
  type: string
  source: string
  providerId?: string
  productId?: string
  orderId?: string
  userId?: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
}

// Disparar un evento y propagarlo a los sistemas configurados
export async function fireEvent(event: AutomationEvent): Promise<{ eventId: string; propagated: string[] }> {
  // 1. Guardar el evento
  const log = await db.eventLog.create({
    data: {
      type: event.type,
      source: event.source,
      providerId: event.providerId || null,
      productId: event.productId || null,
      orderId: event.orderId || null,
      userId: event.userId || null,
      title: event.title,
      description: event.description || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      status: 'PENDING',
    },
  })

  const propagated: string[] = []

  // 2. Propagar según el tipo de evento
  try {
    switch (event.type) {
      case 'PRODUCT_PUBLISHED':
      case 'PRODUCT_FEATURED':
        propagated.push(...await onProductPublished(event))
        break
      case 'ORDER_CREATED':
        propagated.push(...await onOrderCreated(event))
        break
      case 'SHIPMENT_REQUESTED':
        propagated.push(...await onShipmentRequested(event))
        break
      case 'PROVIDER_REGISTERED':
        propagated.push(...await onProviderRegistered(event))
        break
    }

    await db.eventLog.update({
      where: { id: log.id },
      data: { status: 'COMPLETED', propagated: JSON.stringify(propagated) },
    })
  } catch (e) {
    await db.eventLog.update({
      where: { id: log.id },
      data: { status: 'FAILED', propagated: JSON.stringify(propagated) },
    })
    console.error('Automation event failed:', (e as Error).message)
  }

  return { eventId: log.id, propagated }
}

// ---------- Handlers por tipo de evento ----------

// Producto publicado → propagar a directorio, social, web express, afiliados
async function onProductPublished(event: AutomationEvent): Promise<string[]> {
  const propagated: string[] = []
  const productId = event.productId
  if (!productId) return propagated

  const product = await db.product.findUnique({
    where: { id: productId },
    include: { category: true, supplier: { include: { user: true, provider: true } } },
  })
  if (!product) return propagated

  // 1. DIRECTORIO: actualizar featured products del directorio entry
  const dirEntry = await db.directoryEntry.findFirst({ where: { providerId: product.supplier.provider?.id } })
  if (dirEntry) {
    const current = dirEntry.featured ? JSON.parse(dirEntry.featured || '[]') : []
    // Añadir producto a featured si hay espacio (máx 6)
    if (!current.includes(productId) && current.length < 6) {
      current.push(productId)
      await db.directoryEntry.update({
        where: { id: dirEntry.id },
        data: { featured: JSON.stringify(current) },
      })
    }
    propagated.push('DIRECTORIO')
  }

  // 2. SOCIAL: generar post con IA y crearlo como borrador
  if (product.supplier.provider) {
    try {
      const content = await generateProductPost({
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        description: product.description,
        category: product.category?.name,
        supplier: product.supplier.companyName,
      }, 'INSTAGRAM', 'entusiasta')

      // Buscar cuenta social del proveedor
      const account = await db.socialAccount.findFirst({ where: { userId: product.supplier.user.id } })
      await db.socialPost.create({
        data: {
          userId: product.supplier.user.id,
          caption: content.caption,
          mediaUrls: JSON.stringify([product.imageUrl].filter(Boolean)),
          mediaType: 'IMAGE',
          productId: product.id,
          affiliateCode: product.supplier.provider.affiliateCode,
          status: 'DRAFT',
          accounts: account ? { create: { accountId: account.id } } : undefined,
        },
      })
      propagated.push('SOCIAL')
    } catch (e) {
      console.error('Social propagation failed:', (e as Error).message)
    }
  }

  // 3. WEB EXPRESS: actualizar featuredProducts del sitio
  const website = await db.websiteExpress.findFirst({ where: { providerId: product.supplier.provider?.id } })
  if (website) {
    const current = website.featuredProducts ? JSON.parse(website.featuredProducts) : []
    if (!current.includes(productId) && current.length < 6) {
      current.push(productId)
      await db.websiteExpress.update({
        where: { id: website.id },
        data: { featuredProducts: JSON.stringify(current) },
      })
    }
    propagated.push('WEB_EXPRESS')
  }

  // 4. AFILIADOS: registrar en metadata para notificación (en prod se enviaría email)
  propagated.push('AFILIADOS')

  return propagated
}

// Orden creada → notificar afiliados, actualizar métricas
async function onOrderCreated(event: AutomationEvent): Promise<string[]> {
  const propagated: string[] = ['AFILIADOS', 'MARKETPLACE']
  // Las comisiones ya se generan en la API de orders
  return propagated
}

// Envío solicitado → notificar mensajeros disponibles
async function onShipmentRequested(event: AutomationEvent): Promise<string[]> {
  return ['FUERZA_DELTA']
}

// Proveedor registrado → crear ficha directorio, notificar admin
async function onProviderRegistered(event: AutomationEvent): Promise<string[]> {
  const propagated: string[] = []
  const providerId = event.providerId
  if (!providerId) return propagated

  const provider = await db.provider.findUnique({ where: { id: providerId } })
  if (!provider) return propagated

  // Crear ficha en directorio si no existe
  const existing = await db.directoryEntry.findFirst({ where: { providerId } })
  if (!existing) {
    await db.directoryEntry.create({
      data: {
        providerId,
        category: provider.category || 'Otros',
        shortDesc: provider.description || `${provider.companyName} — ${provider.category || 'Proveedor'}`,
        tags: JSON.stringify([provider.category, provider.city, 'Ecuador']),
      },
    })
    propagated.push('DIRECTORIO')
  }

  // Crear sticker para el álbum
  const dirEntry = await db.directoryEntry.findFirst({ where: { providerId } })
  if (dirEntry) {
    const existingSticker = await db.sticker.findFirst({ where: { directoryEntryId: dirEntry.id } })
    if (!existingSticker) {
      await db.sticker.create({
        data: {
          directoryEntryId: dirEntry.id,
          name: `Sticker ${provider.companyName}`,
          imageUrl: provider.logoUrl || `https://picsum.photos/seed/sticker-${provider.websiteSlug}/200/200`,
          code: (provider.companyName.slice(0, 4).toUpperCase()) + '-STK',
          rarity: 'COMMON',
        },
      })
      propagated.push('ALBUM')
    }
  }

  propagated.push('ADMIN')
  return propagated
}

// ---------- Consultas ----------

export async function getRecentEvents(limit = 50) {
  return db.eventLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      provider: { select: { companyName: true, logoUrl: true } },
      product: { select: { name: true, imageUrl: true, price: true } },
    },
  })
}

export async function getEventStats() {
  const [total, completed, failed, pending] = await Promise.all([
    db.eventLog.count(),
    db.eventLog.count({ where: { status: 'COMPLETED' } }),
    db.eventLog.count({ where: { status: 'FAILED' } }),
    db.eventLog.count({ where: { status: 'PENDING' } }),
  ])
  // Eventos por tipo
  const byTypeRaw = await db.eventLog.groupBy({ by: ['type'], _count: true, orderBy: { _count: { type: 'desc' } } })
  const byType = byTypeRaw.map((t) => ({ type: t.type, count: t._count }))
  // Eventos por fuente
  const bySourceRaw = await db.eventLog.groupBy({ by: ['source'], _count: true })
  const bySource = bySourceRaw.map((s) => ({ source: s.source, count: s._count }))
  return { total, completed, failed, pending, byType, bySource }
}
