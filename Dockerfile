# ============================================================================
# TaskFlow API - Multi-Stage Production Dockerfile
# ============================================================================

# Stage 1: Build & Dependency Resolution
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Production Image
FROM node:20-alpine AS release

WORKDIR /usr/src/app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Security: Set environment
ENV NODE_ENV=production \
    PORT=5000

# Copy node modules and project files
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/
COPY sql/ ./sql/
COPY scripts/ ./scripts/

# Use non-root node user for container security
USER node

EXPOSE 5000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
