FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches/ ./patches/ 2>/dev/null || true

# Copy all package.json files for dependency resolution
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/scamshield/package.json ./artifacts/scamshield/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Build frontend (outputs to artifacts/scamshield/dist/public)
RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/scamshield run build

# Copy built frontend into api-server/public so Express can serve it
RUN cp -r artifacts/scamshield/dist/public artifacts/api-server/public

# Build API server (outputs to artifacts/api-server/dist)
RUN pnpm --filter @workspace/api-server run build

# ---- Runtime image (smaller) ----
FROM node:20-slim AS runner
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace files needed for runtime deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/scamshield/package.json ./artifacts/scamshield/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy built artifacts from build stage
COPY --from=base /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=base /app/artifacts/api-server/public ./artifacts/api-server/public

EXPOSE 8080

CMD ["node", "artifacts/api-server/dist/index.mjs"]
