import { Router } from "express"
import { v4 as uuidv4 } from "uuid"
import { body, validationResult } from 'express-validator';
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import { generateTokens, hashToken } from "../utils/jwt"
import { findRefreshTokenById, revokeRefreshToken, revokeUserTokens, whiteListRefreshToken } from "../lib/auth"
import { findUserById, createUser, findUserByempNumber } from "../lib/user"
import { requireClean, requireRole } from "../middleware"
import { isNewEmployee } from "../validators";

const router = Router()

router.post("/register-admin", requireClean, body("password").isLength({ min: 6 }), body("empNumber").isString().isLength({ max: 4, min: 4 }), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { empNumber, password, name } = req.body;
        const jti = uuidv4()
        // if there is a password; it must be > 5 char long
        const user = await createUser({ empNumber, password, role: "Admin", name: name ?? null })
        const { accessToken, refreshToken } = generateTokens(user, jti)
        await whiteListRefreshToken({ jti, refreshToken, userId: user.id })
        res.status(200).json({ accessToken, refreshToken }).send()
    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
})

router.post("/create-user",
    requireRole,
    body("password").isLength({ min: 6 }),
    body("empNumber").isNumeric().custom(isNewEmployee),
    body("role").isString().isIn(["Admin", "Employee"]),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const { empNumber, password, role, name } = req.body;
            const jti = uuidv4()
            const user = await createUser({ empNumber, password, role, name: name ?? null })
            const { accessToken, refreshToken } = generateTokens(user, jti)
            await whiteListRefreshToken({ jti, refreshToken, userId: user.id })
            res.status(200).json({ accessToken, refreshToken }).send()
        } catch (error) {
            console.error(error);
            return res.status(500)
        }
    })

router.post("/login", body("empNumber").isNumeric(), body("password"),  async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { empNumber, password } = req.body;
        const existingUser = await findUserByempNumber(empNumber);
        if (!existingUser) {
            return res.status(403).send("Invalid credentials");
        }
        const validPassword = await bcrypt.compare(password, existingUser.password);
        if (!validPassword) {
            return res.status(403).send("Invalid credentials");
        }
        await revokeUserTokens(existingUser.id); // kill existing sessions if any
        const jti = uuidv4();
        const { accessToken, refreshToken } = generateTokens(existingUser, jti);
        await whiteListRefreshToken({ jti, refreshToken, userId: existingUser.id })
        res.status(200).json({ accessToken, refreshToken }).send()
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post("/refreshToken", async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).send()
        }
        const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as { jti: string, userId: string }
        const savedRefreshToken = await findRefreshTokenById(payload.jti);

        if (!savedRefreshToken || savedRefreshToken.revoked === true) {
            return res.status(401).send()
        }
        const hashedToken = hashToken(refreshToken);
        if (hashedToken !== savedRefreshToken.hashedToken) {
            return res.status(401).send()
        }
        const user = await findUserById(payload.userId);
        if (!user) {
            return res.status(401).send()
        }
        await revokeRefreshToken(savedRefreshToken.id);
        const jti = uuidv4();
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user, jti);
        await whiteListRefreshToken({ jti, refreshToken: newRefreshToken, userId: user.id });

        return res.status(200).json({
            accessToken,
            refreshToken: newRefreshToken
        }).send()
    } catch (error) {
        console.error(error)
        return res.status(500).send()
    }
});

export default router;