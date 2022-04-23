import { User } from "@prisma/client";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export function generateAccessToken(user: User) {
    return jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET, {
        expiresIn: '30m',
    })
}

export function generateRefreshToken(user: User, jti: string) {
    return jwt.sign({ userId: user.id, jti }, process.env.JWT_REFRESH_SECRET, { expiresIn: '48h' });
}

export function generateTokens(user: User, jti: string) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, jti);
    return { accessToken, refreshToken };
}

export function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}