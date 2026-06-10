FROM node:20-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.graphics.json ./
COPY scripts ./scripts
COPY src ./src

RUN npm run build:graphics \
    && node scripts/sync-fonts.js \
    && node scripts/sync-canvas-assets.js

FROM node:20-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts

RUN mkdir -p /app/data

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node scripts/healthcheck.js

CMD ["node", "."]