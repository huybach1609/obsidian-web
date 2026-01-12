# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package.json ./

# Install all dependencies (including devDependencies for build)
# Using npm install instead of npm ci since package-lock.json may not exist
RUN npm install

# Copy source code
COPY . .

# Build-time arguments
ARG NEXT_PUBLIC_API_PROTOCOL
ARG NEXT_PUBLIC_API_HOST
ARG NEXT_PUBLIC_API_PORT

# Expose them to Next.js at build time
ENV NEXT_PUBLIC_API_PROTOCOL=$NEXT_PUBLIC_API_PROTOCOL
ENV NEXT_PUBLIC_API_HOST=$NEXT_PUBLIC_API_HOST
ENV NEXT_PUBLIC_API_PORT=$NEXT_PUBLIC_API_PORT

# Build Next.js application
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the app
CMD ["node", "server.js"]

