import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * /api/locations
 *
 * GET (público): retorna todos los países con sus ciudades.
 *   Respuesta:
 *     { countries: [{ id, name, code, flag, cities: [{ id, name }] }] }
 *
 * Orden: países alfabéticamente por nombre; ciudades alfabéticamente por nombre.
 */
export async function GET() {
  try {
    const countries = await db.country.findMany({
      include: {
        cities: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    const result = countries.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      flag: c.flag,
      cities: c.cities.map((city) => ({ id: city.id, name: city.name })),
    }))

    return NextResponse.json({ countries: result })
  } catch (err) {
    console.error('[api/locations GET] error:', err)
    return NextResponse.json(
      { error: 'No se pudo cargar la lista de ubicaciones' },
      { status: 500 },
    )
  }
}
