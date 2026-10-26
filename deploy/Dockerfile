FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV CI=true

WORKDIR /app

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package manifests and source
COPY package.json pnpm-lock.yaml* ./
COPY src ./src
COPY config ./config

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile || pnpm install --prod

# Non-root user
USER node

CMD ["node", "src/index.js"]
