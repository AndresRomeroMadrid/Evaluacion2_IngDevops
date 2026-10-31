# ==============================================================================
# DOCKERFILE 1: MICROSERVICIO DE CREACIÓN (IE1)
# ==============================================================================
# Estrategia: Multi-Stage Build de 3 etapas basado en Alpine Linux (node:20-alpine).
#   1. deps:       obtiene las dependencias (producción y desarrollo).
#   2. testing:    ejecuta las pruebas unitarias (Jest); si fallan, la build se detiene.
#   3. production: imagen final mínima, solo con dependencias de producción.
# Ventajas:
#   1. Minimiza el peso de la imagen final descartando dependencias de desarrollo y tests.
#   2. Reduce la superficie de ataque para análisis de seguridad (Snyk / Trivy).
#   3. Ejecuta bajo usuario no privilegiado (node) para cumplimiento de seguridad.
# La configuración (NODE_ENV, PORT) no vive en la imagen: se inyecta en runtime
# desde el .env (ver .env.example en la raíz del repositorio).
# ==============================================================================

# ----------------- ETAPA 1: DEPS / DEPENDENCIAS -----------------
FROM node:20-alpine AS deps

WORKDIR /app

# Copia exclusiva de manifiestos para aprovechar el caché de capas de Docker
COPY package*.json ./

# Se instalan primero solo las dependencias de producción (se guardan aparte para la
# etapa final) y luego todas, incluidas las de desarrollo, para ejecutar los tests
RUN npm ci --omit=dev \
    && cp -R node_modules /prod_node_modules \
    && npm ci \
    && npm cache clean --force

# ----------------- ETAPA 2: TESTING / PRUEBAS -------------------
FROM deps AS testing

COPY src/ ./src/
COPY tests/ ./tests/

# Jest valida además el umbral de cobertura definido en package.json
RUN npm test

# ----------------- ETAPA 3: PRODUCTION / PRODUCCIÓN -------------
FROM node:20-alpine AS production

# Definición de metadatos de gobernanza
LABEL maintainer="Ingeniería DevOps - Duoc UC"
LABEL service="microservicio-creacion"
LABEL description="Contenedor optimizado multi-stage para servicio de creación y catálogo"

WORKDIR /app

# Copiar dependencias de producción desde la etapa 'deps'
COPY --from=deps --chown=node:node /prod_node_modules ./node_modules

# Copiar el código fuente desde la etapa 'testing': así la imagen solo se construye
# si las pruebas pasaron
COPY --chown=node:node package*.json ./
COPY --from=testing --chown=node:node /app/src ./src

# Cambiar a usuario no root por seguridad
USER node

# Exponer el puerto del microservicio
EXPOSE 3001

# Comando de inicio del microservicio
CMD ["node", "src/server.js"]
