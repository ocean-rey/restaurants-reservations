# using stages

# prepare deps
FROM node:16 AS deps
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
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
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start"]

