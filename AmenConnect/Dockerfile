# ==========================================
# AmenConnect Client Application Dockerfile
# Multi-stage production build (Node + Nginx)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Cache package dependencies
COPY AmenConnect/package.json AmenConnect/package-lock.json* ./AmenConnect/
RUN cd AmenConnect && npm install --legacy-peer-deps

# Copy shared context and application source code
COPY ThemeContext.tsx ./
COPY AmenConnect/ ./AmenConnect/

WORKDIR /app/AmenConnect
RUN npx vite build

# ------------------------------------------
# Production Nginx Runtime Stage
# ------------------------------------------
FROM nginx:alpine AS production

COPY AmenConnect/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/AmenConnect/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

