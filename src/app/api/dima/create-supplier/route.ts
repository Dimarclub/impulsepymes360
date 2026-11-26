import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

const db = db

/**
 * GET /api/dima/create-supplier?token=dimar-setup-2024&email=X&companyName=Y&category=Z&city=W
 *
 * Crea un Supplier vinculado a un User existente.
 * Si el User no tiene supplier, lo crea.
 * Si ya tiene supplier, lo actualiza.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const token = searchParams.get('token')
    const expected = process.env.SETUP_TOKEN || 'dimar-setup-2024'
    if (token !== expected) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const email = searchParams.get('email')?.trim().toLowerCase()
    const companyName = searchParams.get('companyName')?.trim()
    const category = searchParams.get('category')?.trim() || 'Servicios'
    const city = searchParams.get('city')?.trim() || 'Guayaquil'
    const phone = searchParams.get('phone')?.trim() || ''

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Faltan parámetros. Uso: ?email=X&companyName=Y&category=Z&city=W' },
        { status: 400 }
      )
    }

    // Buscar el usuario
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: `Usuario no encontrado: ${email}` }, { status: 404 })
    }

    // Verificar si ya tiene supplier
    let supplier = await db.supplier.findUnique({ where: { userId: user.id } })
    
    const supplierData = {
      companyName,
      phone: phone || user.phone || null,
      city,
      category,
      verified: true,
      rating: 5,
      address: `${city}, Ecuador`,
    }

    if (supplier) {
      // Actualizar
      supplier = await db.supplier.update({
        where: { id: supplier.id },
        data: supplierData,
      })
      return NextResponse.json({
        ok: true,
        message: 'Supplier actualizado',
        supplier: { id: supplier.id, companyName: supplier.companyName, userId: user.id },
      })
    }

    // Crear nuevo supplier
    supplier = await db.supplier.create({
      data: {
        userId: user.id,
        ...supplierData,
      },
    })

    return NextResponse.json({
      ok: true,
      message: 'Supplier creado',
      supplier: {
        id: supplier.id,
        companyName: supplier.companyName,
        userId: user.id,
        userEmail: user.email,
        category: supplier.category,
        city: supplier.city,
      },
    })
  } catch (error) {
    console.error('[create-supplier] error:', error)
    return NextResponse.json(
      { error: 'Error al crear supplier', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  } finally {
  }
}
