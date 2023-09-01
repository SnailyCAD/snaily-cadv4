#build
FROM node:18 as builder

RUN npm install -g pnpm

WORKDIR /snailycad

COPY . ./

RUN pnpm config set httpTimeout 1200000 && \
  npx turbo prune --scope=@snailycad/api --docker && \
  pnpm install

RUN pnpm turbo run build --filter=@snailycad/api

ENV NODE_ENV="production"

CMD ["pnpm", "workspace", "@snailycad/api", "start"]