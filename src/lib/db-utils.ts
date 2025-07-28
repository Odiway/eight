import { prisma } from './prisma'

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect()
    await prisma.$disconnect()
    return true
  } catch (error) {
    console.error('Database connection failed:', error)
    return false
  }
}

export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const result = await operation()
    return result
  } catch (error) {
    console.error('Database operation failed:', error)
    return fallback
  }
}
