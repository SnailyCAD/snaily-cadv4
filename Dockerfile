#build
FROM node:18 as build
ARG BUILD_CONTEXT

WORKDIR /app

COPY package.json .

COPY yarn.lock .

COPY ./apps/$BUILD_CONTEXT/package.json apps/$BUILD_CONTEXT/

COPY ./packages /app/packages
COPY ./scripts /app/scripts
COPY . /app/


WORKDIR /app

RUN yarn set version stable

RUN yarn install

COPY ./apps/$BUILD_CONTEXT apps/$BUILD_CONTEXT

RUN yarn run turbo build


CMD ["yarn", "start"]