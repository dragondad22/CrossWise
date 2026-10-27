import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { databaseUrl } from './preview'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// A preview uses its branch's own database (ADR-010); everywhere else, DATABASE_URL as it is.
const createClient = () =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
