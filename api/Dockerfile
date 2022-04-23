# using stages
# prepare deps
FROM node:16 AS deps
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
# run prisma:generate to prepare the prisma client
# end of deps stage

# build app
FROM node:16 AS builder
WORKDIR /usr/src/app
COPY . .
COPY --from=deps /usr/src/app/node_modules ./node_modules
RUN npm run build
# end of builder stage

FROM node:16 AS RUNNER
WORKDIR /usr/src/app
EXPOSE 3000
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/scripts ./scripts
COPY --from=builder /usr/src/app/.env ./.env
RUN chmod +x ./scripts/*.sh
CMD ["./scripts/wait-for-it.sh", "db:5432", "--", "./scripts/startup.sh"]

