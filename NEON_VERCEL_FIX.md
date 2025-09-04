# Neon Database Connection Fix for Vercel

## The Problem
Neon databases sometimes have connection issues on Vercel serverless functions due to:
1. **Connection pooling** requirements
2. **SSL/TLS** configuration
3. **Serverless cold starts**

## Quick Fix
Add these query parameters to your DATABASE_URL in Vercel:

### Original URL format:
```
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Enhanced URL for Vercel:
```
postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15&connection_limit=1
```

## Steps to Fix in Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Edit your DATABASE_URL** and add these parameters:
   - `pgbouncer=true` - Enables connection pooling
   - `connect_timeout=15` - Increases timeout for cold starts
   - `connection_limit=1` - Limits connections per serverless function

3. **Complete URL example:**
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15&connection_limit=1
   ```

4. **Redeploy** after updating the environment variable

## Alternative: Use Neon's Connection Pooling URL

Neon provides a pooled connection URL specifically for serverless:

1. Go to https://console.neon.tech/
2. Select your database
3. Look for **"Pooled connection"** or **"Connection pooling"**
4. Copy the pooled connection string (it usually contains `pgbouncer=true`)
5. Use this URL in Vercel instead of the direct connection URL

This should resolve the "Veritabanı bağlantı hatası" error in production!
