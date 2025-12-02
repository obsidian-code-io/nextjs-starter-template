# Stage 1: Dependencies
FROM oven/bun:1-alpine AS deps

# (Optional) Compat layer if you need glibc-like stuff; often not needed,
# but keeping it close to your original intent.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files & Prisma schema
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies with Bun
RUN bun install

# Stage 2: Builder
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/bun.lockb* ./
COPY package.json ./
COPY prisma ./prisma/
COPY src ./src
COPY public ./public
COPY next.config.ts ./
COPY tsconfig.json ./
COPY components.json ./
COPY postcss.config.mjs ./
COPY open-next.config.ts ./
COPY wrangler.jsonc ./
COPY cloudflare-env.d.ts ./

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

# Generate Prisma Client (works via Bun's Node compat)
RUN bunx prisma generate

# Build the application
RUN bun run build

# Stage 3: Runner
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup -S nodejs -g 1001 && \
    adduser -S nextjs -u 1001 -G nodejs

# Copy public folder
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use Bun to run the standalone server
CMD ["bun", "server.js"]
