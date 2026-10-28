import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion: string | undefined
}

// Bump this version when the Prisma schema gains new models so the cached
// client in dev mode is recreated with the new types/prototype.
const PRISMA_VERSION = 'v3-cpa'

const cached =
  globalForPrisma.prisma && globalForPrisma.prismaVersion === PRISMA_VERSION

export const db = cached
  ? globalForPrisma.prisma!
  : new PrismaClient({
      log: ['query'],
    })

console.log('[db.ts] cached=', cached, '| cpaTask type=', typeof (db as any).cpaTask)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaVersion = PRISMA_VERSION
}