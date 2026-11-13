ARG NODE_VERSION=24.19

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /site
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY astro.config.mjs tsconfig.json config.json ./
COPY public/ public/
COPY src/ src/
ENV DEPLOYMENT=WORKER
RUN yarn build

FROM node:${NODE_VERSION}-alpine
WORKDIR /site
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /site/dist/ dist/
COPY docker/worker-shutdown.mjs ./
ENV NODE_ENV=production HOST=127.0.0.1 PORT=4321
USER node
CMD ["node", "--import", "./worker-shutdown.mjs", "dist/server/entry.mjs"]
