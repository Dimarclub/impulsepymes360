import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const db = db

/**
 * GET /api/dima/seed-categories?token=dimar-setup-2024
 *
 * Crea todas las categorías base + subcategorías del marketplace.
 * Idempotente: si ya existen, las actualiza.
 */

const CATEGORIES = [
  {
    name: 'Bazar y Papelería',
    slug: 'bazar-y-papeleria',
    icon: 'ShoppingBag',
    color: '#F5A623',
    children: [
      { name: 'Vajilla y Cristalería', slug: 'vajilla-y-cristaleria' },
      { name: 'Cocina y Comedor', slug: 'cocina-y-comedor' },
      { name: 'Utensilios de Cocina', slug: 'utensilios-de-cocina' },
      { name: 'Papelería Escolar', slug: 'papeleria-escolar' },
      { name: 'Oficina', slug: 'oficina' },
      { name: 'Cuadernos y Libretas', slug: 'cuadernos-y-libretas' },
      { name: 'Artículos de Escritura', slug: 'articulos-de-escritura' },
    ],
  },
  {
    name: 'Juguetes',
    slug: 'juguetes',
    icon: 'Gift',
    color: '#E4405F',
    children: [
      { name: 'Juguetes Didácticos', slug: 'juguetes-didacticos' },
      { name: 'Muñecas y Peluches', slug: 'munecas-y-peluches' },
      { name: 'Vehículos de Juguete', slug: 'vehiculos-de-juguete' },
      { name: 'Juegos de Mesa', slug: 'juegos-de-mesa' },
      { name: 'Juguetes Electrónicos', slug: 'juguetes-electronicos' },
    ],
  },
  {
    name: 'Cosméticos y Cuidado Personal',
    slug: 'cosmeticos-y-cuidado-personal',
    icon: 'Sparkles',
    color: '#A855F7',
    children: [
      { name: 'Maquillaje', slug: 'maquillaje' },
      { name: 'Cuidado de la Piel', slug: 'cuidado-de-la-piel' },
      { name: 'Cuidado del Cabello', slug: 'cuidado-del-cabello' },
      { name: 'Perfumes y Fragancias', slug: 'perfumes-y-fragancias' },
      { name: 'Higiene Personal', slug: 'higiene-personal' },
      { name: 'Sex Shop', slug: 'sex-shop' },
    ],
  },
  {
    name: 'Electrónica',
    slug: 'electronica',
    icon: 'Smartphone',
    color: '#3B82F6',
    children: [
      { name: 'Celulares y Accesorios', slug: 'celulares-y-accesorios' },
      { name: 'Computación', slug: 'computacion' },
      { name: 'Audio y Video', slug: 'audio-y-video' },
      { name: 'Gaming', slug: 'gaming' },
      { name: 'Accesorios Electrónicos', slug: 'accesorios-electronicos' },
    ],
  },
  {
    name: 'Ropa y Moda',
    slug: 'ropa-y-moda',
    icon: 'Shirt',
    color: '#10B981',
    children: [
      { name: 'Ropa Hombre', slug: 'ropa-hombre' },
      { name: 'Ropa Mujer', slug: 'ropa-mujer' },
      { name: 'Ropa Infantil', slug: 'ropa-infantil' },
      { name: 'Calzado', slug: 'calzado' },
      { name: 'Bolsos y Carteras', slug: 'bolsos-y-carteras' },
      { name: 'Accesorios de Moda', slug: 'accesorios-de-moda' },
    ],
  },
  {
    name: 'Comida y Bebidas',
    slug: 'comida-y-bebidas',
    icon: 'UtensilsCrossed',
    color: '#F97316',
    children: [
      { name: 'Alimentos Básicos', slug: 'alimentos-basicos' },
      { name: 'Bebidas', slug: 'bebidas' },
      { name: 'Snacks y Dulces', slug: 'snacks-y-dulces' },
      { name: 'Lácteos', slug: 'lacteos' },
      { name: 'Orgánicos y Naturales', slug: 'organicos-y-naturales' },
    ],
  },
  {
    name: 'Restaurantes y Comida',
    slug: 'restaurantes-y-comida',
    icon: 'Utensils',
    color: '#EF4444',
    children: [
      { name: 'Comida Tradicional', slug: 'comida-tradicional' },
      { name: 'Comida Rápida', slug: 'comida-rapida' },
      { name: 'Pizzerías', slug: 'pizzerias' },
      { name: 'Cafeterías', slug: 'cafeterias' },
      { name: 'Comida Internacional', slug: 'comida-internacional' },
      { name: 'Delivery', slug: 'delivery' },
    ],
  },
  {
    name: 'Hogar y Muebles',
    slug: 'hogar-y-muebles',
    icon: 'Home',
    color: '#8B5CF6',
    children: [
      { name: 'Muebles de Sala', slug: 'muebles-de-sala' },
      { name: 'Muebles de Dormitorio', slug: 'muebles-de-dormitorio' },
      { name: 'Decoración', slug: 'decoracion' },
      { name: 'Iluminación', slug: 'iluminacion' },
      { name: 'Electrodomésticos', slug: 'electrodomesticos' },
      { name: 'Limpieza del Hogar', slug: 'limpieza-del-hogar' },
    ],
  },
  {
    name: 'Salud y Bienestar',
    slug: 'salud-y-bienestar',
    icon: 'Heart',
    color: '#EC4899',
    children: [
      { name: 'Farmacia', slug: 'farmacia' },
      { name: 'Suplementos', slug: 'suplementos' },
      { name: 'Cuidado de la Salud', slug: 'cuidado-de-la-salud' },
      { name: 'Fitness y Deporte', slug: 'fitness-y-deporte' },
      { name: 'Bienestar Mental', slug: 'bienestar-mental' },
    ],
  },
  {
    name: 'Servicios',
    slug: 'servicios',
    icon: 'Wrench',
    color: '#6366F1',
    children: [
      { name: 'Servicios Técnicos', slug: 'servicios-tecnicos' },
      { name: 'Consultoría', slug: 'consultoria' },
      { name: 'Educación', slug: 'educacion' },
      { name: 'Transporte', slug: 'transporte' },
      { name: 'Eventos', slug: 'eventos' },
      { name: 'Otros Servicios', slug: 'otros-servicios' },
    ],
  },
  {
    name: 'Hoteles y Turismo',
    slug: 'hoteles-y-turismo',
    icon: 'Hotel',
    color: '#06B6D4',
    children: [
      { name: 'Hoteles', slug: 'hoteles' },
      { name: 'Hostales', slug: 'hostales' },
      { name: 'Tours y Excursiones', slug: 'tours-y-excursiones' },
      { name: 'Lugares Turísticos', slug: 'lugares-turisticos' },
      { name: 'Transporte Turístico', slug: 'transporte-turistico' },
    ],
  },
  {
    name: 'Autos y Vehículos',
    slug: 'autos-y-vehiculos',
    icon: 'Car',
    color: '#475569',
    children: [
      { name: 'Venta de Autos', slug: 'venta-de-autos' },
      { name: 'Repuestos', slug: 'repuestos' },
      { name: 'Accesorios para Autos', slug: 'accesorios-para-autos' },
      { name: 'Alquiler de Vehículos', slug: 'alquiler-de-vehiculos' },
      { name: 'Mantenimiento', slug: 'mantenimiento' },
    ],
  },
  {
    name: 'Otros',
    slug: 'otros',
    icon: 'Package',
    color: '#6B7280',
    children: [
      { name: 'Varios', slug: 'varios' },
      { name: 'Importadoras', slug: 'importadoras' },
      { name: 'Mayoristas', slug: 'mayoristas' },
    ],
  },
]

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const results: string[] = []
    let created = 0
    let updated = 0

    for (const cat of CATEGORIES) {
      let parent = await db.category.findUnique({ where: { slug: cat.slug } })
      const parentData = {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        color: cat.color,
        parentId: null,
      }
      if (parent) {
        parent = await db.category.update({ where: { id: parent.id }, data: parentData })
        updated++
        results.push(`↻ ${cat.name}`)
      } else {
        parent = await db.category.create({ data: parentData })
        created++
        results.push(`✓ ${cat.name}`)
      }

      // Crear subcategorías
      for (const child of cat.children) {
        const existing = await db.category.findUnique({ where: { slug: child.slug } })
        const childData = {
          name: child.name,
          slug: child.slug,
          parentId: parent.id,
        }
        if (existing) {
          await db.category.update({ where: { id: existing.id }, data: childData })
        } else {
          await db.category.create({ data: childData })
          results.push(`  └─ ${child.name}`)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      message: 'Categorías creadas',
      created,
      updated,
      totalCategorias: CATEGORIES.length,
      totalSubcategorias: CATEGORIES.reduce((acc, c) => acc + c.children.length, 0),
      results,
    })
  } catch (error) {
    console.error('[seed-categories] error:', error)
    return NextResponse.json(
      { error: 'Error', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
  }
}
