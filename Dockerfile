# ---- Pulse UI build stage ----
# Builds the new dashboard (pulse-ui/) into pulse-ui/dist so the final
# image can copy it in without dragging node_modules along.
FROM node:20-slim AS pulse-builder
WORKDIR /pulse
COPY pulse-ui/package.json pulse-ui/package-lock.json ./
RUN npm ci --no-audit
COPY pulse-ui/ ./
RUN npm run build

# ---- Final image ----
FROM node:20-slim

WORKDIR /app

# Install system utilities needed for monitoring (ping, traceroute, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    iputils-ping \
    traceroute \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY extra/download-dist.js ./extra/download-dist.js

# Install production dependencies
RUN npm ci --omit dev --no-audit --legacy-peer-deps

# Install additional packages for OIDC and cookie parsing
RUN npm install openid-client@5 cookie-parser --no-audit --legacy-peer-deps

# Copy pre-built frontend (built locally with our Login.vue changes)
COPY dist/ ./dist/

# Copy server code (includes our REST API additions) and supporting files
COPY server/ ./server/
COPY src/ ./src/
COPY config/ ./config/
COPY db/ ./db/
COPY extra/ ./extra/

# Pulse UI bundle (built in the pulse-builder stage above).
# server.js mounts this at /v2/ when the directory exists.
COPY --from=pulse-builder /pulse/dist ./pulse-ui/dist

# Uptime Kuma default port
EXPOSE 3001

# Data directory
VOLUME /app/data

ENV NODE_ENV=production
ENV UPTIME_KUMA_IS_CONTAINER=1

HEALTHCHECK --interval=60s --timeout=30s --start-period=180s --retries=5 \
  CMD node -e "const http = require('http'); const options = { hostname: 'localhost', port: 3001, path: '/api/entry-page', timeout: 5000 }; http.get(options, (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); }).on('error', () => process.exit(1));"

ENTRYPOINT ["node", "server/server.js"]
