# ============================================================================
# DOCKERFILE FRONT-END - ClubManager
# ============================================================================
# Multi-stage build pour optimisation taille image
# Build optimisé pour déploiement S3 + CloudFront

# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
FROM node:18-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies (production + dev pour build)
RUN npm ci --legacy-peer-deps

# ============================================================================
# STAGE 2: Builder
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_API_BASE_URL
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_SENTRY_DSN
ARG NODE_ENV=production

# Set environment variables for build
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV NODE_ENV=$NODE_ENV

# Build application
RUN npm run build

# List built files (for debugging)
RUN ls -la /app/dist

# ============================================================================
# STAGE 3: Production (Nginx pour servir les fichiers statiques)
# ============================================================================
FROM nginx:alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/share/nginx/html && \
    chown -R nodejs:nodejs /var/cache/nginx && \
    chown -R nodejs:nodejs /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R nodejs:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nodejs

# Expose port 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# ============================================================================
# STAGE 4: S3 Deployment (optionnel - pour upload direct vers S3)
# ============================================================================
FROM amazon/aws-cli:latest AS s3-deployer

# Copy built files
COPY --from=builder /app/dist /dist

# Ce stage est utilisé uniquement pour CI/CD
# La commande de déploiement sera:
# aws s3 sync /dist s3://bucket-name --delete

# ============================================================================
# Metadata
# ============================================================================
LABEL maintainer="ClubManager Team"
LABEL version="1.0.0"
LABEL description="ClubManager Front-end - React + Vite"

# ============================================================================
# Build Instructions:
# ============================================================================
#
# Development:
# docker build -t clubmanager-frontend:dev \
#   --build-arg VITE_API_BASE_URL=http://localhost:4000 \
#   --build-arg VITE_STRIPE_PUBLIC_KEY=pk_test_xxx \
#   --target production .
#
# Production:
# docker build -t clubmanager-frontend:latest \
#   --build-arg VITE_API_BASE_URL=https://api.clubmanager.com \
#   --build-arg VITE_STRIPE_PUBLIC_KEY=pk_live_xxx \
#   --build-arg VITE_SENTRY_DSN=https://xxx@sentry.io/xxx \
#   --target production .
#
# S3 Deployment (via CI/CD):
# docker build -t clubmanager-frontend:s3 \
#   --build-arg VITE_API_BASE_URL=https://api.clubmanager.com \
#   --target s3-deployer .
#
# ============================================================================
