# Multi-stage build for production
FROM node:18-alpine AS base

# Build the frontend
FROM base AS frontend-builder
WORKDIR /app

# Copy frontend source
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/index.html ./frontend/
COPY frontend/src ./frontend/src
COPY frontend/public ./frontend/public

# Install frontend dependencies and build with Vite
RUN cd frontend && npm ci --only=production && npm run build

# Build the backend
FROM base AS backend-builder
WORKDIR /app

# Copy backend source
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Install backend dependencies and compile TypeScript without npm scripts
RUN npm ci --only=production && node node_modules/typescript/bin/tsc -p tsconfig.json

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

# Copy built frontend (Vite outputs to dist/ instead of build/)
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy icons provided by user into server root so they are served at /<name>.png
COPY icons/android-chrome-192x192.png ./frontend/dist/android-chrome-192x192.png
COPY icons/android-chrome-512x512.png ./frontend/dist/android-chrome-512x512.png
COPY icons/apple-touch-icon.png ./frontend/dist/apple-touch-icon.png
COPY icons/favicon-16x16.png ./frontend/dist/favicon-16x16.png
COPY icons/favicon-32x32.png ./frontend/dist/favicon-32x32.png
COPY icons/favicon.ico ./frontend/dist/favicon.ico

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port for Cloud Run (8080)
EXPOSE 8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/stats', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
