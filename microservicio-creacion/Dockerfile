# ==============================================================================
# DOCKERFILE 1: MICROSERVICIO DE CREACIÓN (IE1)
# ==============================================================================
# Estrategia: Multi-Stage Build basado en Alpine Linux (node:20-alpine).
# Ventajas:
#   1. Minimiza el peso de la imagen final descartando herramientas de compilación.
#   2. Reduce la superficie de ataque para análisis de seguridad (Snyk / Trivy).
#   3. Ejecuta bajo usuario no privilegiado (node) para cumplimiento de seguridad.
# ==============================================================================

# ----------------- ETAPA 1: BUILDER / DEPENDENCIAS -----------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copia exclusiva de manifiestos para aprovechar el caché de capas de Docker
COPY package*.json ./

# Instalación estricta de dependencias excluyendo dependencias de desarrollo
RUN npm ci --omit=dev && npm cache clean --force

# ----------------- ETAPA 2: RUNNER / PRODUCCIÓN -------------------
FROM node:20-alpine AS runner

# Definición de metadatos de gobernanza
LABEL maintainer="Ingeniería DevOps - Duoc UC"
LABEL service="microservicio-creacion"
LABEL description="Contenedor optimizado multi-stage para servicio de creación y catálogo"

ENV NODE_ENV=production
ENV PORT=3001

WORKDIR /app

# Crear directorio de trabajo y asegurar permisos del usuario no root 'node'
RUN chown -R node:node /app

# Copiar dependencias de producción desde la etapa 'builder'
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copiar código fuente de la aplicación
COPY --chown=node:node package*.json ./
COPY --chown=node:node src/ ./src/

# Cambiar a usuario no root por seguridad
USER node

# Exponer el puerto del microservicio
EXPOSE 3001

# Comando de inicio del microservicio
CMD ["node", "src/server.js"]
