FROM node:24-slim
# Prisma necesita OpenSSL para su motor de consultas
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && apt-get clean
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build
EXPOSE 3000
# Al arrancar: aplica las migraciones pendientes, carga los datos iniciales (sin duplicar) y levanta la API
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node dist/main.js"]
