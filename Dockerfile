FROM oven/bun:1-alpine AS builder

RUN mkdir -p /home/node/app && chown bun:bun /home/node/app

USER bun
WORKDIR /home/node/app

COPY --chown=node ./ntfy.js .
COPY --chown=node ./index.js .
COPY --chown=node ./package.json .
COPY --chown=node ./bun.lock .

ENV NODE_ENV=production

RUN --mount=type=cache,target=/usr/local/share/.cache bun install --production --frozen-lockfile



FROM oven/bun:1-alpine AS final

RUN apk --purge del apk-tools

RUN mkdir -p /home/node/app && chown bun:bun /home/node/app

USER bun
WORKDIR /home/node/app

ENV NODE_ENV=production

COPY --chown=bun ./README.md .
COPY --chown=bun ./LICENCE.md .

COPY --from=builder --chown=bun /home/node/app/package.json .
COPY --from=builder --chown=bun /home/node/app/ntfy.js .
COPY --from=builder --chown=bun /home/node/app/index.js .
COPY --from=builder --chown=bun /home/node/app/node_modules ./node_modules

EXPOSE 8008

CMD ["bun", "start"]