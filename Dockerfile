FROM node:24-alpine3.20 AS builder
ENV NODE_ENV=production

WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production=false --network-timeout 300000

COPY . .
RUN yarn global add prisma-json-types-generator prisma-kysely
RUN npx prisma generate

RUN yarn build

FROM node:24-alpine3.20
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./

EXPOSE 8000
CMD ["node", "dist/src/index.js"]
