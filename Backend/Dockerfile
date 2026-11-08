# ==========================================
# AmenConnect Backend Dockerfile
# ==========================================
FROM node:20-alpine AS production

# Install system utilities for healthchecks
RUN apk add --no-cache wget

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source code
COPY . .

# Ensure non-root node user owns application directory
RUN chown -R node:node /app

USER node

EXPOSE 3000

ENV PORT=3000 \
  NODE_ENV=production

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]

