import { RefreshTokens } from "../utils/db";
import { hashToken } from "../utils/jwt";


export function whiteListRefreshToken({ jti, refreshToken, userId }: WhiteListRefreshTokenParams) {
    return RefreshTokens.create({ data: { id: jti, hashedToken: hashToken(refreshToken), userId } })
}

export function findRefreshTokenById(id: string) {
    return RefreshTokens.findUnique({ where: { id } })
}

export function revokeToken(id: string) {
    return RefreshTokens.update({ where: { id }, data: { revoked: true } })
}

export function revokeUserTokens(userId: string) {
    return RefreshTokens.updateMany({ where: { userId }, data: { revoked: true } })
}

type WhiteListRefreshTokenParams = { jti: string, refreshToken: string, userId: string }