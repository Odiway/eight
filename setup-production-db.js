#!/usr/bin/env node

/**
 * Setup script for Vercel Postgres database
 * Run this after setting up your Vercel Postgres database
 */

const { execSync } = require('child_process')
const fs = require('fs')

console.log('🚀 Setting up production database...')

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production'
const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is not set')
  console.log('Please set your DATABASE_URL in Vercel environment variables')
  process.exit(1)
}

// Check if this is a PostgreSQL connection string
if (
  !databaseUrl.startsWith('postgresql://') &&
  !databaseUrl.startsWith('postgres://')
) {
  console.error('❌ DATABASE_URL must be a PostgreSQL connection string')
  console.log('Current DATABASE_URL:', databaseUrl)
  process.exit(1)
}

try {
  console.log('📄 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  console.log('🔄 Pushing database schema...')
  execSync('npx prisma db push', { stdio: 'inherit' })

  console.log('✅ Database setup completed successfully!')
  console.log('🎯 Your application is now ready for production deployment')
} catch (error) {
  console.error('❌ Database setup failed:', error.message)
  console.log('')
  console.log('Troubleshooting steps:')
  console.log('1. Verify your DATABASE_URL is correct')
  console.log('2. Ensure your PostgreSQL database is accessible')
  console.log('3. Check if your database credentials are valid')
  process.exit(1)
}
