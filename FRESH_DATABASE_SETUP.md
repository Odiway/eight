# Fresh Database Setup Guide

## Step 1: Create New Neon Database

1. Go to https://console.neon.tech/
2. Click "Create Project" or "New Project"
3. Choose a name like "temsa-battery-fresh" or "temsa-production-v2"
4. Select the same region as your old database (probably us-east-2)
5. Click "Create Project"

## Step 2: Get New Connection String

1. In your new Neon project dashboard
2. Go to "Connection Details" or "Dashboard"
3. Copy the **Pooled connection** string (this is important for Vercel)
4. It should look like:
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
   ```

## Step 3: Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update `DATABASE_URL` with the new connection string
3. Make sure NO quotes around the value
4. Save changes

## Step 4: Deploy Database Schema

Run these commands locally with the new DATABASE_URL:

```bash
# Set the new database URL temporarily
$env:DATABASE_URL="your_new_neon_connection_string_here"

# Generate Prisma client
npx prisma generate

# Push schema to new database
npx prisma db push

# Verify schema
npx prisma studio
```

## Step 5: Migrate Data (Run sync script)

```bash
# Run the password sync script with new database
node sync-passwords.js
```

## Step 6: Test New Database

1. Redeploy your Vercel app (it will automatically use new DATABASE_URL)
2. Test login functionality
3. Test database-dependent pages like /team, /projects

## Benefits of Fresh Database:
- ✅ Clean slate - no corruption issues
- ✅ Latest Prisma schema
- ✅ Proper connection pooling from start
- ✅ All 26 users properly synced
- ✅ No legacy connection issues

Would you like me to create the sync script optimized for the fresh database?
