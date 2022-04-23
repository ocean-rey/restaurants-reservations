#!/bin/sh
echo "*** Starting Dev Build ***"
npm run prisma:migrate && \
npm run prisma:push && \
npm run start