import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

import { Users } from "./utils/db";
import cache from "./utils/cache"
import { findUserById } from "./lib/user";

// TODO
export const requireRole = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).send();
    }
    try {
        // it would be faster to simply store the role in the jwt
        // but that wasn't the task requirment so i'll do it this way
        const payload = jwt.verify(authorization, process.env.JWT_ACCESS_SECRET) as { userId: string };
        // getting this far means we have a valid token, get the role from the cache
        var role = await cache.get(payload.userId) as null | "Employee" | "Admin" // these are the only possible values
        if (!role) {
            // if no role; call the db and store the role in cache
            const user = await findUserById(payload.userId);
            if (!user) {
                return res.status(401).send()
            }
            cache.set(payload.userId, user.role)
            role = user.role
        }
        req.role = role
    } catch (error) {
        console.error(error)
        return res.status(401).send()
    }
    return next();
}

// TODO
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).send();
    }
    try {
        // it would be faster than redis to simply store the role in the jwt
        // but that wasn't the task requirment so i'll do it this way
    } catch (error) {
        return res.status(401).send()
    }
    return next();
}

export const requireClean = async (req: Request, res: Response, next: NextFunction) => {
    // check that the db is actually clean
    const count = await Users.count();
    if (count === 0) {
        return next()
    }
    return res.status(401).send("Already initialized!")
}
