# ==============================================================================
# DOCKERFILE 2: MICROSERVICIO DE ACTUALIZACIÓN (IE1)
# ==============================================================================
# Estrategia: Single-Stage Hardened Production Container basado en Debian Slim
#             (node:20-bookworm-slim).
# Diferencias clave con el Dockerfile 1 (Creación):
#   1. Sistema base Debian Bookworm Slim (glibc) vs Alpine Linux (musl libc).
#   2. Incorpora la herramienta 'curl' para Healthcheck nativo de contenedor.
#   3. Implementa directiva nativa HEALTHCHECK a nivel de Docker engine.
#   4. Estrategia de capa única reforzada con usuario no privilegiado (node).
# ==============================================================================

FROM node:20-bookworm-slim

# Metadatos del contenedor
LABEL maintainer="Ingeniería DevOps - Duoc UC"
LABEL service="microservicio-actualizacion"
LABEL description="Contenedor Debian Slim con verificación de salud nativa para servicio de actualización"

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3002
ENV CREATE_SERVICE_URL=http://service-create:3001

WORKDIR /usr/src/app

# Instalación de curl para monitoreo y comprobación de salud de contenedores
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Copia de manifiestos y dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copia de código fuente
COPY src/ ./src/

# Configuración de propiedad de archivos para usuario no root
RUN chown -R node:node /usr/src/app

# Cambio al usuario no privilegiado 'node'
USER node

# Exposición del puerto de servicio
EXPOSE 3002

# Verificación de salud nativa en el contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Comando de ejecución
CMD ["node", "src/server.js"]
