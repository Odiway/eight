# Node.js base image
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY prisma ./prisma/

# Dependencies'leri yükle
RUN npm ci

# Prisma Client'ı generate et
RUN npx prisma generate

# Uygulama kodlarını kopyala
COPY . .

# Next.js'i build et (production için)
# RUN npm run build

# Port'u expose et
EXPOSE 3000

# Development komutu (docker-compose ile override edilecek)
CMD ["npm", "run", "dev"]
