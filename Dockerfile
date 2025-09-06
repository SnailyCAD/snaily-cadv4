FROM node:20-slim AS base

WORKDIR /snailycad

# Install pnpm globally and set config in one layer
RUN npm install -g pnpm && pnpm config set httpTimeout 1200000

# Copy only package files first for better caching
COPY pnpm-lock.yaml package.json ./

FROM base AS deps

RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY . ./

FROM deps AS api
ENV NODE_ENV="production"
RUN pnpm turbo run build --filter=@snailycad/api
WORKDIR /snailycad/apps/api
CMD ["pnpm", "start"]

FROM deps AS client
ENV NODE_ENV="production"
RUN rm -rf /snailycad/apps/client/.next
RUN pnpm create-images-domain
RUN pnpm turbo run build --filter=@snailycad/client
WORKDIR /snailycad/apps/client
CMD ["pnpm", "start"]