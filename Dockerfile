FROM node:20-bookworm as builder

USER node
RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY --chown=node ./ntfy.js /home/node/app
COPY --chown=node ./index.js /home/node/app
COPY --chown=node ./package.json /home/node/app
COPY --chown=node ./yarn.lock /home/node/app

ENV NODE_ENV=production

RUN yarn --production --frozen-lockfile
RUN yarn cache clean

FROM node:20-alpine as final

USER node
RUN mkdir -p /home/node/app
WORKDIR /home/node/app

COPY --from=builder --chown=node /home/node/app/node_modules ./node_modules
COPY --from=builder --chown=node /home/node/app/index.js .
COPY --from=builder --chown=node /home/node/app/ntfy.js .
COPY --from=builder --chown=node /home/node/app/package.json .

COPY --chown=node ./README.md /home/node/app
COPY --chown=node ./LICENCE.md /home/node/app

ENV NODE_ENV=production

EXPOSE 8008

CMD ["yarn", "start"]