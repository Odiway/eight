# User Authentication System - Temsada Batarya Üretim Departmanı

## System Overview
This document describes the authentication system for the Temsada Battery Production Department management application.

## Authentication Method
- **Database-based Authentication**: All user credentials are securely stored in the database
- **Password Encryption**: All passwords are hashed using bcryptjs for security
- **Session Management**: Cookie-based sessions with 24-hour expiration
- **Role-based Access Control**: Admin and User roles with different permissions

## User Roles

### Admin Access
- **Role:** ADMIN
- **Access:** Full system access including:
  - Dashboard management
  - Project creation and management
  - Team member management
  - Report generation
  - System settings

### User Access
- **Role:** USER
- **Access:** Limited access including:
  - Personal calendar view
  - Task assignments
  - Project viewing (assigned projects only)
  - Basic reports

## Team Structure

### Batarya Paketleme Ekibi (Battery Packaging Team)
- Ali AĞCAKOYUNLU
- Berkay ŞİMŞEK
- Canberk ALBAY
- Ekrem ATICI
- Fatih Rüştü PITIR
- Hüseyin Can SAK
- Kemal TAŞTAN
- Oğuzhan İNANDI
- Ömer ARISOY
- Samet DANACI
- Yaşar DOĞAN
- Yunus Emre KOÇ
- Yusuf KEBÜDE

### Batarya Geliştirme Ekibi (Battery Development Team)
- Arda SÖNMEZ
- Batuhan SALICI
- Berk ERTÜRK
- Biran Can TÜRE
- Esra DÖNMEZ
- Mete Han KUŞDEMİR
- Muhammed KARAKUŞ
- Murat KARA
- Selim AKBUDAK

### Satın Alma Ekibi (Procurement Team)
- Fatih AVCI
- Polen ACIMIŞ

### Proje Geliştirme Ekibi (Project Development Team)
- Gökhan BİLGİN

## Security Features

### Password Policy
- Minimum 8 characters
- Mix of uppercase, lowercase, and numbers
- Secure random generation
- bcrypt hashing before database storage

### Session Security
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag enabled in production
- SameSite strict policy
- 24-hour session timeout

### Database Security
- All credentials stored securely in PostgreSQL database
- No plaintext passwords in code or configuration files
- Connection string secured via environment variables

## Login Instructions

### For Users
1. Navigate to `/login` page
2. Select "Kullanıcı Girişi" (User Login)
3. Enter your assigned username and password
4. Access will be granted based on your role permissions

### For Administrators
1. Navigate to `/login` page
2. Select "Yönetici Girişi" (Admin Login)
3. Use admin credentials
4. Full system access will be granted

## Security Notes

⚠️ **Important Security Practices:**
- Credentials are managed through secure database storage
- No sensitive information should be stored in version control
- Regular password updates recommended
- Monitor login attempts and suspicious activity
- Database credentials secured via environment variables

## Technical Implementation
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL (Neon)
- **Authentication**: Cookie-based sessions
- **Password Hashing**: bcryptjs
- **Session Storage**: HTTP-only cookies
- **Middleware**: Route protection and role validation

---

**Note**: This system replaces any previous hardcoded credential systems for enhanced security. All user authentication is now handled through secure database lookup and password verification.
