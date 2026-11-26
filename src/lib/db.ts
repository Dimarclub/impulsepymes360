import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaVersion: string | undefined
}

// Bump this version when the Prisma schema gains new models so the cached
// client in dev mode is recreated with the new types/prototype.
const PRISMA_VERSION = 'v12-reset-password'

const cached =
  globalForPrisma.prisma && globalForPrisma.prismaVersion === PRISMA_VERSION

// Configuración optimizada para Vercel Postgres (plan gratuito = 60 conexiones máx)
const prismaOptions = {
  log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

export const db = cached
  ? globalForPrisma.prisma!
  : new PrismaClient(prismaOptions)

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
  globalForPrisma.prismaVersion = PRISMA_VERSION
}