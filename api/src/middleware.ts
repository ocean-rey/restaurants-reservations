import { Request, Response, NextFunction } from "express";
import { Users } from "./utils/db";


// TODO
export const requireRole = async (req: Request, res: Response, next: NextFunction) => {
    const {authorization} = req.headers;
    if(!authorization){
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

// TODO
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const {authorization} = req.headers;
    if(!authorization){
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

export const requireClean = async (req: Request, res: Response, next: NextFunction)=>{
    // check that the db is actually clean
    const count = await Users.count();
    if(count === 0){
        return next()
    }
    return res.status(401).send("Already initialized!")
}
