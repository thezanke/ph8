ARG NODE_VERSION=16.8-alpine

FROM node:${NODE_VERSION} AS api-builder
WORKDIR /app
COPY package*.json tsconfig*.json /app/
ENV NODE_ENV=development
RUN npm ci
COPY src /app/src
RUN npm run build

FROM node:${NODE_VERSION} AS api
WORKDIR /app
COPY --from=api-builder /app/package.json /app/package-lock.json /app/
ENV NODE_ENV=production
RUN npm ci
COPY --from=api-builder /app/dist /app/dist
CMD ["npm", "run", "start:prod"]
