# Production Database Setup Guide

## 🎯 Goal
Add all user credentials from USER_CREDENTIALS.md to your Neon (PostgreSQL) production database.

## 📋 Prerequisites
- Vercel project deployed
- Neon database created and connected
- Database schema migrated (tables created)

## 🚀 Method 1: Using Vercel Environment (Recommended)

### Step 1: Set Environment Variable
In your Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Make sure `DATABASE_URL` points to your Neon database connection string
4. Example: `postgresql://username:password@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require`

### Step 2: Run Migration (if not done)
```bash
# Make sure your production database has the correct schema
npx prisma migrate deploy
```

### Step 3: Seed Users
```bash
# Option A: Run locally with production DATABASE_URL
DATABASE_URL="your_neon_connection_string" node seed-neon-db.js

# Option B: Run through Vercel CLI
vercel env pull .env.production
DATABASE_URL="$(cat .env.production | grep DATABASE_URL | cut -d '=' -f2)" node seed-neon-db.js
```

## 🛠 Method 2: Direct Database Connection

### Step 1: Update .env temporarily
```bash
# Replace your current DATABASE_URL with your Neon connection string
DATABASE_URL="postgresql://username:password@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

### Step 2: Run Prisma Generate
```bash
npx prisma generate
```

### Step 3: Run Seeding Script
```bash
node seed-neon-db.js
```

### Step 4: Restore local .env
```bash
# Change back to local SQLite
DATABASE_URL="file:./dev.db"
```

## 📊 What Gets Created

The script will create **25 users total**:

### 👑 Admin Account (1)
- **Username:** admin
- **Password:** Securepassword1  
- **Role:** ADMIN (full system access)

### 👥 Regular Users (24)
- **Batarya Paketleme Ekibi:** 13 users
- **Batarya Geliştirme Ekibi:** 9 users  
- **Satın Alma Ekibi:** 2 users
- **Proje Geliştirme Ekibi:** 1 user
- **Role:** USER (calendar access only)

## ✅ Verification

After running the script, you should see:
```
✅ ali.agcakoyunlu - Ali AĞCAKOYUNLU
✅ berkay.simsek - Berkay ŞİMŞEK
...
🎉 Successfully created 25 users in Neon database!
```

## 🧪 Test Production Login

Visit your Vercel URL and test:

**Admin Login:**
1. Click "Yönetici Girişi"
2. Username: `admin`
3. Password: `Securepassword1`
4. Should redirect to `/dashboard`

**User Login:**
1. Click "Kullanıcı Girişi"  
2. Username: `oguzhan.inandi`
3. Password: `T9r2E8y5`
4. Should redirect to `/calendar`

## 🔧 Troubleshooting

### Error: "Connection refused"
- Check your Neon connection string
- Make sure database is active (not paused)

### Error: "Table doesn't exist"  
- Run `npx prisma migrate deploy` first

### Error: "User already exists"
- Script will skip existing users automatically
- This is normal on re-runs

## 🔒 Security Notes

- All passwords are hashed with bcrypt (12 rounds)
- JWT tokens used for session management  
- Role-based access control enforced
- Middleware protects all routes

## 📞 Next Steps

1. ✅ Run the seeding script
2. ✅ Test admin and user logins on production
3. ✅ Verify role-based redirections work
4. ✅ Share login credentials with team members
5. 🔮 Consider implementing password change feature

---

**Need help?** The script includes detailed console output to track progress and identify any issues.
