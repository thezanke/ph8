ARG NODE_VERSION=19.9-buster-slim

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY package*.json tsconfig*.json /app/
ENV NODE_ENV=development
RUN npm ci
COPY src /app/src
RUN npm run build

FROM node:${NODE_VERSION} AS production
WORKDIR /app
COPY --from=builder /app/package.json /app/package-lock.json /app/
ENV NODE_ENV=production
RUN npm ci
COPY --from=builder /app/dist /app/dist
CMD ["npm", "run", "start:prod"]
