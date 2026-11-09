FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df AS build
WORKDIR /site
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY astro.config.mjs tsconfig.json config.json ./
COPY public/ public/
COPY src/ src/
ENV DEPLOYMENT=WORKER
RUN yarn build

FROM node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df
WORKDIR /site
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /site/dist/ dist/
COPY docker/worker-shutdown.mjs ./
ENV NODE_ENV=production HOST=127.0.0.1 PORT=4321
USER node
CMD ["node", "--import", "./worker-shutdown.mjs", "dist/server/entry.mjs"]
