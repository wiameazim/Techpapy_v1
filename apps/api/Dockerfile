FROM node:24-alpine AS base
WORKDIR /repo
RUN apk add --no-cache openssl

# --- deps: install full workspace deps once, using the root lockfile ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
RUN npm ci --workspace=apps/api --include-workspace-root

# --- build: compile TS + generate prisma client ---
FROM deps AS build
COPY apps/api apps/api
RUN npm run build --workspace=apps/api

# --- production: prod-only deps + compiled output ---
FROM base AS production
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma
RUN npm ci --workspace=apps/api --include-workspace-root --omit=dev \
  && npx --workspace=apps/api prisma generate
COPY --from=build /repo/apps/api/dist apps/api/dist
RUN chown -R node:node /repo

EXPOSE 4000
USER node
WORKDIR /repo/apps/api
CMD ["node", "dist/index.js"]
