# ==============================================================================
# DOCKERFILE 2: MICROSERVICIO DE ACTUALIZACIÓN (PYTHON / FLASK) (IE1)
# ==============================================================================
# Estrategia: Hardened Production Container basado en Python 3.12 Debian Slim
#             (python:3.12-slim).
# Diferencias clave con el Dockerfile 1 (Node.js Alpine Multi-Stage):
#   1. Ecosistema Python 3.12 (CPython / pip) vs Node.js 20 (npm / V8).
#   2. Sistema base Debian Slim (glibc) vs Alpine Linux (musl libc).
#   3. Incorpora 'curl' para Healthcheck nativo de contenedor en Docker Engine.
#   4. Usuario de seguridad no root 'appuser' creado con UID/GID explícitos.
# ==============================================================================

FROM python:3.12-slim

# Metadatos del contenedor
LABEL maintainer="Ingeniería DevOps - Duoc UC"
LABEL service="microservicio-actualizacion"
LABEL language="python"
LABEL framework="flask"
LABEL description="Contenedor Python 3.12 con verificación de salud nativa para servicio de actualización"

# Variables de entorno
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    PORT=3002 \
    CREATE_SERVICE_URL=http://service-create:3001

WORKDIR /app

# Instalación de utilidades del sistema (curl para monitoreo y comprobación de salud)
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Creación de usuario no root para cumplimiento de seguridad (gobernanza de contenedores)
RUN groupadd -g 1000 appgroup && \
    useradd -u 1000 -g appgroup -s /bin/bash -m appuser

# Copia e instalación de dependencias de Python
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copia del código fuente del microservicio
COPY src/ ./src/

# Configurar permisos de la aplicación para el usuario no privilegiado
RUN chown -R appuser:appgroup /app

# Cambio al usuario no root
USER appuser

# Exponer el puerto de escucha
EXPOSE 3002

# Verificación de salud nativa (HEALTHCHECK) en el motor de Docker
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Comando de inicio del microservicio en Python
CMD ["python", "src/server.py"]
