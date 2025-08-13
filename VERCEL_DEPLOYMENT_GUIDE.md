# Vercel Deployment Configuration Guide

## Database Setup for Production

Your application is currently configured for PostgreSQL in production and SQLite for local development.

### Step 1: Set up a Production Database

You have several options for PostgreSQL hosting:

1. **Vercel Postgres** (Recommended for Vercel deployment)
2. **Neon** (Serverless PostgreSQL)
3. **Supabase** (Open source alternative)
4. **Railway** (Simple deployment)

### Step 2: Configure Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add the following variables:

```
DATABASE_URL = your_postgresql_connection_string
NEXTAUTH_SECRET = your_production_secret_key
NEXTAUTH_URL = your_production_domain
NODE_ENV = production
```

### Step 3: Database Migration

After setting up your PostgreSQL database, you'll need to:

1. Generate and push the Prisma schema:

```bash
npx prisma db push
```

2. Optionally seed your database:

```bash
npx prisma db seed
```

### Step 4: Local Development

For local development, the app will use SQLite via `.env.local`:

```
DATABASE_URL="file:./dev.db"
```

### Example PostgreSQL Connection Strings:

**Vercel Postgres:**

```
postgresql://username:password@ep-xxx.us-east-1.postgres.vercel-storage.com/verceldb
```

**Neon:**

```
postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/dbname
```

**Supabase:**

```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

### Important Notes:

1. Never commit your production DATABASE_URL to version control
2. The `.env.local` file is automatically ignored by Git
3. Production environment variables are set in Vercel dashboard
4. Database schema is now configured for PostgreSQL in production
