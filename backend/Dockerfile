# Use Node.js 18 LTS Alpine image for smaller size
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && ln -sf python3 /usr/bin/python

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# Build stage
FROM base AS build
COPY . .
RUN npm ci && npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S desicargo -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Create logs directory with proper permissions
RUN mkdir -p logs && chown -R desicargo:nodejs logs

# Switch to non-root user
USER desicargo

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4000/health || exit 1

# Expose port
EXPOSE 4000

# Start the application
CMD ["node", "dist/index.js"]