# Multi-stage build for production
FROM node:18-alpine AS base

# Build the frontend
FROM base AS frontend-builder
WORKDIR /app

# Copy frontend source
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public

# Install frontend dependencies and build without npm scripts
RUN cd frontend && npm ci && node node_modules/react-scripts/bin/react-scripts.js build

# Build the backend
FROM base AS backend-builder
WORKDIR /app

# Copy backend source
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Install backend dependencies and compile TypeScript without npm scripts
RUN npm ci && node node_modules/typescript/bin/tsc -p tsconfig.json

# Production image
FROM base AS runner
WORKDIR /app

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built backend
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./

# Copy built frontend
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/stats', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
