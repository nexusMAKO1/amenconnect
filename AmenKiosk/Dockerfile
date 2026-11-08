# ==========================================
# AmenKiosk Totem Terminal Application Dockerfile
# Multi-stage production build (Node + Nginx)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Cache package dependencies
COPY AmenKiosk/package.json AmenKiosk/package-lock.json* ./AmenKiosk/
RUN cd AmenKiosk && npm install --legacy-peer-deps

# Copy shared context and application source code
COPY ThemeContext.tsx ./
COPY AmenKiosk/ ./AmenKiosk/

WORKDIR /app/AmenKiosk
RUN npx vite build

# ------------------------------------------
# Production Nginx Runtime Stage
# ------------------------------------------
FROM nginx:alpine AS production

COPY AmenKiosk/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/AmenKiosk/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

