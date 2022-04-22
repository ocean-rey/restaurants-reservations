import bcrypt from "bcrypt";
import { Users } from "../utils/db"

export function findUserByUsername(username: string) {
    return Users.findUnique({ where: { username } })
}

export function createUser(user: { username: string, password: string }) {
    user.password = bcrypt.hashSync(user.password, 12);
    return Users.create({ data: user })
}

export function findUserById(id: string) {
    return Users.findUnique({ where: { id } })
}