FROM node:18 as base

RUN npm install -g pnpm

WORKDIR /snailycad

COPY . ./

FROM base as deps

RUN pnpm config set httpTimeout 1200000 && \
  npx turbo prune --scope=@snailycad/api --docker && \
  pnpm install

FROM deps as api

ENV NODE_ENV="production"

RUN pnpm turbo run build --filter=@snailycad/api

CMD ["pnpm", "--filter", "@snailycad/api", "start"]

FROM deps as client

ENV NODE_ENV="production"

RUN pnpm turbo run build --filter=@snailycad/client

CMD ["pnpm", "--filter", "@snailycad/client", "start"]