ARG NODE_VERSION=20.5

FROM node:${NODE_VERSION} AS base
RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml /app/
WORKDIR /app

FROM base AS builder
COPY tsconfig*.json /app/
ENV NODE_ENV=development
RUN pnpm i
COPY src /app/src
RUN npm run build

FROM base AS production
WORKDIR /app
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/
ENV NODE_ENV=production
RUN pnpm i
COPY --from=builder /app/dist /app/dist
CMD ["pnpm", "start:prod"]
