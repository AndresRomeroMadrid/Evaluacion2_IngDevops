#!/bin/bash
# ==============================================================================
# Despliegue en la instancia EC2 (se ejecuta remotamente vía AWS SSM Run Command)
# ==============================================================================
# El pipeline antepone a este script las variables COMPOSE_B64 y ENV_B64 con el
# docker-compose.yml y el .env codificados en base64. Las imágenes se descargan
# desde Docker Hub; no se construye nada en la instancia.
# No se envía el token de Docker Hub: si los repositorios son privados, hacer
# `docker login` una vez en la instancia.
# ==============================================================================
set -euo pipefail

APP_DIR=/opt/microservicios

command -v docker >/dev/null || { echo "Docker no está instalado en la instancia" >&2; exit 1; }
docker compose version >/dev/null || { echo "Falta el plugin Docker Compose en la instancia" >&2; exit 1; }

mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "$COMPOSE_B64" | base64 -d > docker-compose.yml
echo "$ENV_B64" | base64 -d > .env
chmod 600 .env

docker compose pull
docker compose up -d --no-build --remove-orphans

# Verificación de salud de los tres servicios
set -a
. ./.env
set +a
for puerto in "$CREATE_PORT" "$UPDATE_PORT" "$FRONTEND_PORT"; do
  curl --fail --silent --retry 10 --retry-delay 3 --retry-connrefused \
    "http://localhost:${puerto}/health" > /dev/null
  echo "Servicio en puerto ${puerto} respondiendo OK"
done

docker compose ps
docker image prune -f
