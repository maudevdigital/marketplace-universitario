# Etapa 1: construir la aplicación React con Vite
FROM node:24-slim AS construccion
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# La dirección de la API queda incluida en el código al construir
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Etapa 2: servir los archivos estáticos con nginx (imagen liviana, sin Node)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /app/dist /usr/share/nginx/html
EXPOSE 80
