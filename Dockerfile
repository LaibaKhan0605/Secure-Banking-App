# Dockerfile - Secure Multi-Stage Build and Rootless Container Guidelines
# Follows industry standards and Docker security best practices

# ==========================================
# STAGE 1: Dependency resolver &builder
# ==========================================
FROM node:20-alpine AS build_stage

WORKDIR /app

# Enable package installation optimization
copy package*.json ./
RUN npm ci

# Copy relevant files
copy . .

# Compile optimized static frontend and bundled server configuration
RUN npm run build

# ==========================================
# STAGE 2: Secure runtime environment
# ==========================================
FROM node:20-alpine AS production_stage

# Security best practice: update base packages to clear CVEs
RUN apk update && apk upgrade --no-cache

WORKDIR /app

# Ensure we have clean dependency records
copy package*.json ./
RUN npm ci --only=production

# Pull built records from build stage
copy --from=build_stage /app/dist ./dist
copy --from=build_stage /app/dist/server.cjs ./dist/server.cjs

# Docker security best practice: Do not run as ROOT user.
# Alpine native Node image comes preset with a low prestige 'node' user.
RUN chown -R node:node /app
USER node

# Expose standard routing port 3000
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.cjs"]
