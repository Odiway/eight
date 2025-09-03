# How to Fix "Veritabanı bağlantı hatası" Error

## Step 1: Get Your Neon Database URL
1. Go to https://console.neon.tech/
2. Select your project
3. Go to "Dashboard"
4. Copy the connection string (it looks like):
   ```
   postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

## Step 2: Add Environment Variable to Vercel
1. Go to https://vercel.com/dashboard
2. Select your project (temsa-one)
3. Go to "Settings" → "Environment Variables"
4. Add a new environment variable:
   - **Name:** DATABASE_URL
   - **Value:** Your Neon connection string from Step 1
   - **Environment:** Production (and Preview if you want)
5. Click "Save"

## Step 3: Add JWT_SECRET (if not already added)
1. In the same Environment Variables section
2. Add another variable:
   - **Name:** JWT_SECRET
   - **Value:** temsada-battery-production-jwt-secret-2025
   - **Environment:** Production (and Preview if you want)
3. Click "Save"

## Step 4: Redeploy
After adding the environment variables:
1. Go to "Deployments" tab in your Vercel project
2. Click the three dots on the latest deployment
3. Click "Redeploy"
OR
4. Just push a small change to your GitHub repo to trigger a new deployment

## Step 5: Test Again
After redeployment, try logging in again with:
- Username: arda.sonmez
- Password: F2k8W5j3

---

## If you need to find your Neon connection string:
Run this command locally to see what DATABASE_URL you used when syncing passwords:

```bash
echo $env:DATABASE_URL
```

Or check your sync-passwords.js script - the DATABASE_URL you used there is what you need to add to Vercel.
