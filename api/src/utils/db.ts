import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
export const Users = db.user;
export const RefreshTokens = db.refreshToken;