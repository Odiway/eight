import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Enhanced configuration for Vercel production
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not defined')
  }
  
  // For Neon databases on Vercel, add connection pooling parameters
  if (process.env.VERCEL && url.includes('neon.tech')) {
    const hasPooling = url.includes('pgbouncer=true') || url.includes('connection_limit')
    if (!hasPooling) {
      const separator = url.includes('?') ? '&' : '?'
      return `${url}${separator}pgbouncer=true&connect_timeout=15`
    }
  }
  
  return url
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl()
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Enable connection pooling and proper cleanup in production
if (process.env.VERCEL) {
  // Handle cleanup properly in serverless environment
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Alias for backwards compatibility with notification system
export const prismaWithNotifications = prisma

export default prisma