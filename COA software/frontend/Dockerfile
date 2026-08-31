# ==============================================================================
# Stage 1: Build Frontend Single Page Application
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Accept optional build arguments for API and WebSocket URLs
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_WS_URL=""

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

COPY package*.json ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# ==============================================================================
# Stage 2: Serve Production Assets via Nginx
# ==============================================================================
FROM nginx:alpine

# Copy built static artifacts
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx SPA and Reverse Proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
