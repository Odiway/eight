# Docker Kurulum ve Veritabanı Ayağa Kaldırma Rehberi

## 🎯 Prisma Generate Sonrası Yapılacaklar

### 1. SQLite ile Devam Etmek İçin (Mevcut)
```powershell
# 1. Prisma client'ı generate et
npx prisma generate

# 2. Veritabanını senkronize et
npx prisma db push

# 3. Test verilerini ekle
npm run db:seed

# 4. Uygulamayı başlat
npm run dev
```

### 2. Docker + PostgreSQL'e Geçiş (Önerilen)

#### Docker Dosyaları Oluşturuldu:
- ✅ `docker-compose.yml` - PostgreSQL + Next.js + Prisma Studio
- ✅ `Dockerfile` - Node.js container yapılandırması
- ✅ `.env.docker` - Docker için environment variables
- ✅ `docker/init.sql` - PostgreSQL başlangıç scripti

#### Prisma Schema Güncellendi:
```prisma
datasource db {
  provider = "postgresql" // SQLite'den PostgreSQL'e değiştirildi
  url      = env("DATABASE_URL")
}
```

#### Package.json'a Docker Scriptleri Eklendi:
```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down", 
    "docker:logs": "docker-compose logs -f",
    "docker:migrate": "docker-compose exec app npx prisma migrate dev",
    "docker:seed": "docker-compose exec app npm run db:seed",
    "docker:studio": "docker-compose exec app npx prisma studio"
  }
}
```

## 🚀 Docker ile Kurulum Adımları

### İlk Kurulum:
```powershell
# 1. Docker servislerini başlat
npm run docker:up

# 2. İlk sefer migration'ları çalıştır
npm run docker:migrate

# 3. Test verilerini ekle
npm run docker:seed
```

### Günlük Kullanım:
```powershell
# Sistemi başlat
npm run docker:up

# Sistemi durdur
npm run docker:down

# Logları izle
npm run docker:logs
```

## 🌐 Erişim URL'leri

### Docker ile:
- **Uygulama**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **PostgreSQL**: localhost:5432

### Veritabanı Bağlantı Bilgileri:
```
Host: localhost
Port: 5432
Database: two_main
Username: postgres
Password: password123
```

## 📁 Oluşturulan Dosyalar

### 1. docker-compose.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: two_main
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password123
    ports:
      - "5432:5432"
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password123@postgres:5432/two_main
    depends_on:
      - postgres
    command: npm run dev
```

### 2. Environment Dosyaları

#### .env (Mevcut SQLite)
```properties
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

#### .env.docker (PostgreSQL için)
```properties
DATABASE_URL="postgresql://postgres:password123@postgres:5432/two_main"
NEXTAUTH_SECRET="docker-secret-key-123"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

## 🎯 Docker Avantajları

### ✅ Neden Docker Kullanmalısınız:
1. **Tutarlı Ortam** - Tüm geliştirici ekibinde aynı ortam
2. **Kolay Kurulum** - Tek komutla tüm sistem ayakta
3. **Production Benzeri** - Gerçek deployment ortamını simüle eder
4. **Veritabanı Yönetimi** - PostgreSQL production ortamında kullanılır
5. **İzolasyon** - Sistem bağımlılıkları container'da izole
6. **Backup** - Volume'lar ile veri güvenliği

### ⚡ PostgreSQL vs SQLite:
| Özellik | SQLite | PostgreSQL |
|---------|--------|------------|
| Kurulum | Kolay | Orta |
| Performance | Küçük projeler için iyi | Büyük projeler için üstün |
| Concurrency | Sınırlı | Excellent |
| Production Ready | Hayır | Evet |
| Data Types | Sınırlı | Kapsamlı |
| Backup | Dosya kopyalama | Gelişmiş backup araçları |

## 🔧 Troubleshooting

### Docker Sorunları:
```powershell
# Container'ları yeniden başlat
docker-compose down && docker-compose up -d

# Volume'ları temizle
docker-compose down -v

# İmage'ları yeniden build et
docker-compose build --no-cache
```

### Prisma Sorunları:
```powershell
# Schema değişikliklerini uygula
npm run docker:migrate

# Client'ı yeniden generate et
docker-compose exec app npx prisma generate

# Veritabanını sıfırla
docker-compose exec app npx prisma migrate reset
```

## 📝 Notlar

### Geliştirme Süreci:
1. **SQLite ile başlayabilirsiniz** - Hızlı prototyping için
2. **PostgreSQL'e geçiş yapın** - Production'a yaklaştıkça
3. **Docker kullanın** - Ekip çalışmasında ve CI/CD için

### Backup Stratejisi:
```powershell
# PostgreSQL backup
docker-compose exec postgres pg_dump -U postgres two_main > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres two_main < backup.sql
```

---

**🎯 Sonuç**: Hem SQLite hem de Docker + PostgreSQL seçenekleri hazır. Proje büyüklüğüne ve ekip ihtiyaçlarına göre uygun olanı seçebilirsiniz.**
