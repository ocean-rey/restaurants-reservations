import bcrypt from "bcrypt";
import { Users } from "../utils/db"

export function findUserByempNumber(empNumber: string) {
    return Users.findUnique({ where: { empNumber } })
}

export function createUser(user: { empNumber: string, password: string, role: "Admin" | "Employee", name?: string }) {
    user.password = bcrypt.hashSync(user.password, 12);
    return Users.create({ data: user })
}

export function findUserById(id: string) {
    return Users.findUnique({ where: { id } })
}