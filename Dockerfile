FROM node:22.6.0-bookworm AS builder

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --chown=node ./ntfy.js .
COPY --chown=node ./index.js .
COPY --chown=node ./package.json .
COPY --chown=node ./yarn.lock .

ENV NODE_ENV=production

RUN --mount=type=cache,target=/usr/local/share/.cache yarn --production --frozen-lockfile



FROM node:22.6.0-alpine AS final

RUN apk --purge del apk-tools

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --from=builder --chown=node /home/node/app/node_modules ./node_modules
COPY --from=builder --chown=node /home/node/app/index.js .
COPY --from=builder --chown=node /home/node/app/ntfy.js .
COPY --from=builder --chown=node /home/node/app/package.json .

COPY --chown=node ./README.md .
COPY --chown=node ./LICENCE.md .

ENV NODE_ENV=production

EXPOSE 8008

CMD ["yarn", "start"]