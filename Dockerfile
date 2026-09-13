FROM oven/bun:1-alpine AS builder
ENV NODE_ENV=production

USER bun
WORKDIR /usr/src/app

COPY --chown=bun index.js ntfy.js logger.js package.json bun.lock LICENCE.md ./

RUN sed -i "s/##YEAR##/$(date +%Y)/g" ./LICENCE.md

RUN --mount=type=cache,target=/usr/local/share/.cache bun install --production --frozen-lockfile
RUN bun build \
  --compile ./index.js \
  --asset ./ntfy.js \
  --asset ./logger.js \
  --asset ./node_modules \
  --outfile=gotify-to-ntfy-proxy


FROM alpine:3 AS final
ENV NODE_ENV=production

RUN apk add --no-cache libstdc++

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

COPY --from=builder /usr/src/app/gotify-to-ntfy-proxy ./gotify-to-ntfy-proxy
COPY --from=builder /usr/src/app/LICENCE.md ./LICENCE.md
COPY ./README.md ./

EXPOSE 8008

ENTRYPOINT ["/home/node/app/gotify-to-ntfy-proxy"]