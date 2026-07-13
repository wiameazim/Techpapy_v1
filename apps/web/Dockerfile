FROM node:24-slim AS base
WORKDIR /repo

# --- deps ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=apps/web --include-workspace-root

# --- build ---
FROM deps AS build
COPY apps/web apps/web
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build --workspace=apps/web

# --- production (standalone Next.js output) ---
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
RUN chown -R node:node /repo

EXPOSE 3000
USER node
WORKDIR /repo/apps/web
CMD ["node", "server.js"]
