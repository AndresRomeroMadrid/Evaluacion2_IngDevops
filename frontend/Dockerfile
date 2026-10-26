# ==============================================================================
# DOCKERFILE FRONTEND DASHBOARD
# ==============================================================================
FROM node:20-alpine

LABEL maintainer="Ingeniería DevOps - Duoc UC"
LABEL service="frontend-dashboard"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY public/ ./public/

ENV NODE_ENV=production
ENV PORT=3000
ENV CREATE_SERVICE_URL=http://service-create:3001
ENV UPDATE_SERVICE_URL=http://service-update:3002

USER node

EXPOSE 3000

CMD ["node", "server.js"]
