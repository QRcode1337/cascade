# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy workspace files
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY turbo.json ./

# Copy package files
COPY packages/config/typescript/package.json packages/config/typescript/
COPY packages/schemas/package.json packages/schemas/
COPY packages/runtime/package.json packages/runtime/
COPY packages/db/package.json packages/db/
COPY apps/worker/package.json apps/worker/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/config/typescript packages/config/typescript
COPY packages/schemas packages/schemas
COPY packages/runtime packages/runtime
COPY packages/db packages/db
COPY apps/worker apps/worker

# Generate Prisma client
RUN pnpm --filter @cascade/db db:generate

# Build all packages
RUN pnpm build --filter @cascade/worker...

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder /app/apps/worker/package.json ./apps/worker/

ENV NODE_ENV=production

CMD ["node", "apps/worker/dist/index.js"]
