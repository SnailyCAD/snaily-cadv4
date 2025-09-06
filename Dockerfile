FROM node:20-slim AS base

WORKDIR /snailycad

# Install pnpm globally and set config in one layer
RUN npm install -g pnpm && pnpm config set httpTimeout 1200000

# Copy the rest of the source code
COPY . ./

FROM base AS deps

RUN pnpm install --frozen-lockfile

FROM deps AS build

ENV NODE_ENV="production"

# Build all packages (this will also build the API and Client)
RUN pnpm turbo run build --filter="{packages/*}"


FROM build AS api
ENV NODE_ENV="production"
WORKDIR /snailycad/apps/api
RUN pnpm run build
CMD ["pnpm", "start"]

FROM build AS client
ENV NODE_ENV="production"
WORKDIR /snailycad/apps/client
RUN rm -rf /snailycad/apps/client/.next
RUN pnpm create-images-domain
RUN pnpm run build
CMD ["pnpm", "start"]