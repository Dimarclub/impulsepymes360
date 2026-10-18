import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Importe masivo vía CSV (texto plano)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { csv, supplierId } = body as { csv: string; supplierId: string }
  const slugify = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const lines = csv.trim().split(/\r?\n/).filter(Boolean)
  const header = lines[0].toLowerCase().split(',').map((h) => h.trim())
  const rows = lines.slice(1)
  let created = 0
  const errors: string[] = []

  for (const line of rows) {
    const cols = line.split(',').map((c) => c.trim())
    const row: Record<string, string> = {}
    header.forEach((h, i) => (row[h] = cols[i] ?? ''))

    try {
      if (!row.name || !row.price) {
        errors.push(`Fila inválida: ${line}`)
        continue
      }
      let categoryId = row.categoryid || row.category
      if (!categoryId) {
        const cat = await db.category.findFirst({ where: { name: { contains: row.categoria || 'General' } } })
        categoryId = cat?.id
      }
      if (!categoryId) {
        errors.push(`Sin categoría: ${row.name}`)
        continue
      }
      await db.product.create({
        data: {
          name: row.name,
          slug: slugify(`${row.name}-${row.sku || Date.now()}-${created}`),
          description: row.description || row.descripcion || '',
          price: parseFloat(row.price),
          compareAtPrice: row.compareatprice ? parseFloat(row.compareatprice) : null,
          stock: parseInt(row.stock || '0'),
          sku: row.sku || null,
          imageUrl: row.imageurl || row.image || `https://picsum.photos/seed/${row.sku || row.name}/600/600`,
          categoryId,
          supplierId,
          status: 'ACTIVE',
        },
      })
      created++
    } catch (e) {
      errors.push(`Error en ${row.name}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({ created, errors, total: rows.length })
}
