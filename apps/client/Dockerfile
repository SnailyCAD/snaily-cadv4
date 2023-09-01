#build
FROM node:18 as builder

RUN npm install -g pnpm

WORKDIR /snailycad

COPY . ./

RUN pnpm config set httpTimeout 1200000 && \
  npx turbo prune --scope=@snailycad/client --docker && \
  pnpm install

RUN pnpm turbo run build --filter=@snailycad/client

ENV NODE_ENV="production"

CMD ["pnpm", "workspace", "@snailycad/client", "start"]