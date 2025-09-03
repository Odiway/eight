// Simple database inspection script
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function inspectDatabase() {
  console.log('🔍 Inspecting Neon Database...')
  
  try {
    // Check if User table exists and what columns it has
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    console.log('📋 User table columns:')
    console.table(result)
    
    // Check if there are any users
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`
    console.log(`👥 Current user count: ${userCount[0].count}`)
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message)
    
    // Try to see what tables exist
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `
      console.log('📊 Available tables:')
      console.table(tables)
    } catch (e) {
      console.error('❌ Could not list tables:', e.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

inspectDatabase()
