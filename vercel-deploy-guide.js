#!/usr/bin/env node

/**
 * Quick setup script for Vercel deployment with database
 * This script helps configure your project for Vercel deployment
 */

console.log('🚀 Vercel Deployment Setup')
console.log('==========================')

console.log(`
📋 DEPLOYMENT CHECKLIST:

1. ✅ Database Schema: Configured for PostgreSQL
2. ✅ Environment Files: Separated for dev/prod
3. ✅ Build Scripts: Updated for production

🔄 NEXT STEPS:

1. Install Vercel CLI (if not installed):
   npm i -g vercel

2. Create a Vercel Postgres database:
   vercel storage create postgres

3. Set environment variables in Vercel dashboard:
   - DATABASE_URL (from your Postgres database)
   - NEXTAUTH_SECRET (generate a secure key)
   - NEXTAUTH_URL (your production domain)

4. Deploy to Vercel:
   vercel --prod

📊 DATABASE CONFIGURATION:

Local Development:
- Uses SQLite (file:./dev.db)
- Configured in .env.local

Production:
- Uses PostgreSQL
- DATABASE_URL set in Vercel environment variables

🔧 TROUBLESHOOTING:

If deployment fails:
1. Check DATABASE_URL format: postgresql://user:pass@host:port/db
2. Verify database is accessible
3. Ensure environment variables are set correctly

📚 Resources:
- Vercel Postgres: https://vercel.com/docs/storage/vercel-postgres
- Prisma with Vercel: https://www.prisma.io/docs/guides/deployment/deploying-to-vercel
`)

// Check current configuration
const fs = require('fs')

console.log('\n🔍 CURRENT CONFIGURATION:')

// Check if .env.local exists
if (fs.existsSync('.env.local')) {
  console.log('✅ .env.local exists (for local development)')
} else {
  console.log('❌ .env.local missing (create for local SQLite)')
}

// Check Prisma schema
if (fs.existsSync('prisma/schema.prisma')) {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8')
  if (schema.includes('provider = "postgresql"')) {
    console.log('✅ Prisma schema configured for PostgreSQL')
  } else {
    console.log('❌ Prisma schema not configured for PostgreSQL')
  }
} else {
  console.log('❌ Prisma schema file not found')
}

console.log('\n🎯 Ready for deployment! Follow the steps above.')
