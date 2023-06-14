#build
FROM node:18 as builder

WORKDIR /snailycad

COPY . ./

RUN yarn config set httpTimeout 1200000 && \
  npx turbo prune --scope=@snailycad/client --docker && \
  yarn install

RUN yarn turbo run build --filter=@snailycad/client

FROM node:18 as runner

WORKDIR /snailycad

COPY --from=builder /snailycad ./

ENV NODE_ENV="production"

CMD yarn workspace @snailycad/client start
