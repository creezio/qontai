# Debian slim : binaire SWC Next.js « gnu » (glibc).
FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG GIT_COMMIT=unknown
ARG GIT_REF=unknown
ARG GIT_BUILD_TIME=unknown
ENV NEXT_TELEMETRY_DISABLED=1
RUN GIT_COMMIT="$GIT_COMMIT" GIT_REF="$GIT_REF" GIT_BUILD_TIME="$GIT_BUILD_TIME" node -e "\
  const fs = require('fs'); \
  const j = { \
    gitCommit: process.env.GIT_COMMIT || 'unknown', \
    gitRef: process.env.GIT_REF || 'unknown', \
    builtAt: process.env.GIT_BUILD_TIME || 'unknown', \
  }; \
  fs.mkdirSync('public', { recursive: true }); \
  fs.writeFileSync('public/git-version.json', JSON.stringify(j)); \
  "

RUN npm run build

FROM base AS runner
WORKDIR /app

ARG GIT_COMMIT=unknown
ARG GIT_REF=unknown
ARG GIT_BUILD_TIME=unknown
ENV GIT_COMMIT=${GIT_COMMIT}
ENV GIT_REF=${GIT_REF}
ENV GIT_BUILD_TIME=${GIT_BUILD_TIME}
LABEL org.opencontainers.image.revision="${GIT_COMMIT}"
LABEL org.opencontainers.image.version="${GIT_REF}"

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN groupadd --gid 1001 nodejs \
  && useradd --uid 1001 --gid nodejs --no-create-home --shell /usr/sbin/nologin nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

