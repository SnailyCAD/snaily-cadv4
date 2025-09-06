FROM node:18 AS base

RUN npm install -g pnpm

RUN pnpm config set httpTimeout 1200000

WORKDIR /snailycad

COPY . ./

FROM base AS deps

RUN pnpm install

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