# ==============================================================================
# DOCKERFILE 2: MICROSERVICIO DE ACTUALIZACIÓN (PYTHON / FLASK) (IE1)
# ==============================================================================
# Estrategia: Multi-Stage Build de 3 etapas basado en Python 3.12 Debian Slim
#             (python:3.12-slim).
#   1. deps:       obtiene las dependencias (producción y desarrollo).
#   2. testing:    ejecuta las pruebas unitarias (PyTest); si fallan, la build se detiene.
#   3. production: imagen final endurecida, solo con dependencias de producción.
# Diferencias clave con el Dockerfile 1 (Node.js Alpine Multi-Stage):
#   1. Ecosistema Python 3.12 (CPython / pip) vs Node.js 20 (npm / V8).
#   2. Sistema base Debian Slim (glibc) vs Alpine Linux (musl libc).
#   3. Incorpora 'curl' para Healthcheck nativo de contenedor en Docker Engine.
#   4. Usuario de seguridad no root 'appuser' creado con UID/GID explícitos.
# La configuración (PORT, CREATE_SERVICE_URL, PYTHONUNBUFFERED) no vive en la imagen:
# se inyecta en runtime desde el .env (ver .env.example en la raíz del repositorio).
# ==============================================================================

# ----------------- ETAPA 1: DEPS / DEPENDENCIAS -----------------
FROM python:3.12-slim AS deps

WORKDIR /app

COPY requirements.txt requirements-dev.txt ./

# Cada conjunto se instala en su propio prefijo para copiarlo luego a /usr/local
# de la etapa que lo necesite
RUN pip install --no-cache-dir --prefix=/install/prod -r requirements.txt \
    && pip install --no-cache-dir --prefix=/install/dev -r requirements-dev.txt

# ----------------- ETAPA 2: TESTING / PRUEBAS -------------------
FROM python:3.12-slim AS testing

WORKDIR /app

COPY --from=deps /install/dev /usr/local
COPY src/ ./src/
COPY tests/ ./tests/

# Sin bytecode ni caché para no dejar artefactos en /app/src, que se copia a producción
RUN PYTHONDONTWRITEBYTECODE=1 pytest -p no:cacheprovider --cov=src --cov-report=term-missing

# ----------------- ETAPA 3: PRODUCTION / PRODUCCIÓN -------------
FROM python:3.12-slim AS production

# Metadatos del contenedor
LABEL maintainer="Ingeniería DevOps - Duoc UC"
LABEL service="microservicio-actualizacion"
LABEL language="python"
LABEL framework="flask"
LABEL description="Contenedor Python 3.12 con verificación de salud nativa para servicio de actualización"

WORKDIR /app

# Instalación de utilidades del sistema (curl para monitoreo y comprobación de salud)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Creación de usuario no root para cumplimiento de seguridad (gobernanza de contenedores)
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser

# Dependencias de producción desde la etapa 'deps'
COPY --from=deps /install/prod /usr/local

# Código fuente desde la etapa 'testing': así la imagen solo se construye si las
# pruebas pasaron
COPY --from=testing --chown=appuser:appgroup /app/src ./src

# Cambio al usuario no root
USER appuser

# Exponer el puerto de escucha
EXPOSE 3002

# Verificación de salud nativa (HEALTHCHECK) en el motor de Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3002}/health || exit 1

# Comando de inicio del microservicio en Python
CMD ["python", "src/server.py"]
