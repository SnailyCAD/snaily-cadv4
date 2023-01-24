#build
FROM node:18 as build

ARG BUILD_CONTEXT

WORKDIR /app

ENV NODE_ENV "production"

ENV BUILD_CONTEXT ${BUILD_CONTEXT}

COPY package.json .

COPY yarn.lock .

COPY ./apps/$BUILD_CONTEXT/package.json apps/$BUILD_CONTEXT/

COPY ./packages /app/packages
COPY ./scripts /app/scripts
COPY . /app/

WORKDIR /app

RUN yarn set version stable

RUN yarn install

RUN yarn cache clean

COPY ./apps/$BUILD_CONTEXT apps/$BUILD_CONTEXT

RUN yarn run turbo build

CMD yarn workspace @snailycad/$BUILD_CONTEXT start
