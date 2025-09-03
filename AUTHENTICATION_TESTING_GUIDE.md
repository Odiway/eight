# Authentication System Testing Guide

## 🚀 System Overview

The Temsada Battery Production Management System now has a complete authentication system with role-based access control.

## 🔐 Authentication Features

### ✅ Implemented Features:
- **Secure Login System** with username/password
- **Admin vs User Access Control**
- **JWT Token Authentication** (24-hour expiration)
- **Password Hashing** with bcryptjs
- **Role-Based Navigation** filtering
- **Protected Route Middleware**
- **Automatic Redirects** based on user role
- **User Session Management**
- **Secure Logout** functionality

### 👤 User Roles:
- **ADMIN**: Full system access to all features
- **USER**: Limited to calendar view only

## 🧪 Testing Instructions

### 1. **Homepage Test**
- Navigate to `http://localhost:3001`
- Should automatically redirect to `/login`

### 2. **Admin Login Test**
- Click "Yönetici Girişi" tab
- Username: `admin`
- Password: `Securepassword1`
- Should redirect to calendar with full navigation visible
- Admin header should show "Yönetici Paneli"

### 3. **User Login Test** 
Choose any user from the credentials list:
- Click "Kullanıcı Girişi" tab
- Username: `ali.agcakoyunlu` (example)
- Password: `K9m2P8x1`
- Should redirect to calendar with limited navigation (only calendar)
- User dashboard should show "Hoş geldiniz, [Name]"

### 4. **Navigation Access Control Test**
**Admin User:**
- ✅ Can access: Calendar, Projects, Team, Workload, Playground, Reports, Notifications
- ✅ All menu items visible in navigation

**Regular User:**
- ✅ Can access: Calendar only
- ❌ Cannot access: Projects, Team, Workload, etc. (not visible in navigation)
- ❌ Direct URL access to admin routes should redirect to calendar

### 5. **URL Protection Test**
**While logged in as regular user, try accessing:**
- `http://localhost:3001/projects` → Should redirect to `/calendar`
- `http://localhost:3001/team` → Should redirect to `/calendar`  
- `http://localhost:3001/workload` → Should redirect to `/calendar`

### 6. **Logout Test**
- Click on user avatar in top right
- Click "Çıkış Yap"
- Should redirect to login page
- Trying to access any protected route should redirect to login

### 7. **Session Persistence Test**
- Login successfully
- Refresh the page
- Should remain logged in
- Close browser and reopen
- Should remain logged in (until token expires)

### 8. **Token Expiration Test**
- Wait 24 hours or manually modify token
- Should automatically redirect to login

## 📋 User Credentials Reference

### Admin Account:
```
Username: admin
Password: Securepassword1
Role: ADMIN
```

### Sample User Accounts:
```
Username: ali.agcakoyunlu    | Password: K9m2P8x1
Username: arda.sonmez       | Password: F2k8W5j3  
Username: selim.akbudak     | Password: O6s4I8u5
Username: fatih.avci        | Password: P2v8X4k9
```

**Full list:** See `USER_CREDENTIALS.md` file

## 🔧 Technical Details

### Database Schema:
```prisma
model User {
  username    String   @unique
  password    String   // bcrypt hashed
  role        UserRole @default(USER)
  isActive    Boolean  @default(true)
  lastLogin   DateTime?
  // ... other fields
}

enum UserRole {
  ADMIN
  USER
}
```

### JWT Payload:
```javascript
{
  id: user.id,
  username: user.username,
  role: user.role,
  name: user.name,
  email: user.email,
  exp: // 24 hours from now
}
```

### Protected Routes:
- **Middleware-Protected**: All routes except `/login` and `/api/auth/login`
- **Admin-Only Routes**: `/projects`, `/team`, `/workload`, `/playground`, `/reports`, `/notifications`
- **User Routes**: `/calendar` only

## 🛡️ Security Features

1. **Password Hashing**: All passwords stored with bcrypt (12 rounds)
2. **JWT Tokens**: Secure token-based authentication
3. **Route Protection**: Server-side middleware protection
4. **Role Validation**: Client and server-side role checking
5. **Auto Logout**: Invalid/expired tokens automatically logout
6. **HTTPS Ready**: Production-ready security headers

## 📱 User Experience Features

1. **Responsive Design**: Works on all device sizes
2. **Visual Feedback**: Loading states, error messages
3. **Role Indicators**: Clear visual distinction for admin vs user
4. **Smooth Redirects**: Automatic navigation based on access level
5. **User Context**: Persistent user information throughout app

## 🚨 Error Scenarios

### Login Errors:
- Invalid credentials → "Geçersiz yönetici bilgileri" or "Geçersiz şifre"
- Inactive user → "Kullanıcı bulunamadı veya aktif değil"
- Server error → "Sunucu hatası"
- Network error → "Bağlantı hatası oluştu"

### Access Errors:
- Unauthenticated → Redirect to login
- Insufficient permissions → Redirect to calendar
- Expired token → Redirect to login

## 🔄 Next Steps & Enhancements

Potential future improvements:
1. **Password Change** functionality
2. **Remember Me** option
3. **Two-Factor Authentication**
4. **Password Reset** via email
5. **Session Management** dashboard for admins
6. **Audit Logging** for security events
7. **Account Lockout** after failed attempts

## 📞 Support

If any authentication tests fail, check:
1. Database connection (SQLite file exists)
2. Environment variables (JWT_SECRET set)
3. User data populated (run setup-auth-users.js)
4. Server running on correct port
5. Browser localStorage for tokens

---

✅ **Authentication system is fully functional and ready for production use!**
