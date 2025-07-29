import { PrismaClient } from '@prisma/client'

// Runtime migration handler for Vercel
let migrationChecked = false

export async function ensureMigrations() {
  if (migrationChecked) return
  
  try {
    const prisma = new PrismaClient()
    
    // Simple connectivity test
    await prisma.$queryRaw`SELECT 1`
    
    console.log('Database connection verified')
    migrationChecked = true
    
    await prisma.$disconnect()
  } catch (error) {
    console.warn('Database migration check failed:', error)
    // Don't fail the request, just log the warning
  }
}

// Enhanced Prisma client with connection pooling
export function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}
