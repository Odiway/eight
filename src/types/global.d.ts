import { PrismaClient } from '@prisma/client'

declare global {
  // Vercel production ortamı için Prisma global tip tanımı
  var prisma: PrismaClient | undefined
  
  // PDF generation için ek tip tanımları
  namespace NodeJS {
    interface Global {
      prisma: PrismaClient | undefined
    }
  }
}

export {}
