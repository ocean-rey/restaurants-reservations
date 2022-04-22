import { CustomValidator } from "express-validator"
import { Users } from "./utils/db"

export const isNewEmployee: CustomValidator = value => {
    return Users.findUnique({ where: { empNumber: value } }).then((user => {
        if (user) {
            return Promise.reject("Employee ID already in use")
        }
    }))
} 