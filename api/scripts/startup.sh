#!/bin/sh

npm run prisma:migrate && \
npm run prisma:push && \
npm run start