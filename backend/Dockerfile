# Multi-stage Dockerfile for Energy Planet Backend

# ============================================================================
# Stage 1: Build
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# ============================================================================
# Stage 2: Production
# ============================================================================
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Install only production dependencies (clean install)
RUN npm ci --omit=dev && npm cache clean --force

# Create logs directory
RUN mkdir -p /app/logs && chown nodejs:nodejs /app/logs

# NOTE: Content loading
# ContentService will automatically find content at the repo root level
# via config.ts logic: path.join(__dirname, '../../content')
# On Railway with RAILPACK, the full repo is available, so ../content works
# Set CONTENT_PATH env var if content is in a different location
# v2: cleared Docker cache

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
