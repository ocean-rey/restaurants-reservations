import { CustomValidator } from "express-validator"
import { Tables, Users } from "./utils/db"

export const isNewEmployee: CustomValidator = value => {
    return Users.findUnique({ where: { empNumber: value } }).then((user => {
        if (user) {
            return Promise.reject("Employee ID already in use")
        }
    })).catch(err => null) // no op if error
}

export const isNewTable: CustomValidator = value => {
    try {
        return Tables.findUnique({ where: { id: value } }).then((table => {
            if (table) {
                return Promise.reject("Table ID already exists")
            }
        }))
    } catch (error) {
        // technically should be a no-op
        // logging just in case
        console.error(error)
    }
}

export const tableExists: CustomValidator = value => {
    try {
        return Tables.findUnique({ where: { id: value } }).then((table => {
            if (!table) {
                return Promise.reject("Table doesn't exist")
            }
        }))
    } catch (error) {
        // logging just in case
        console.error(error)
        return Promise.reject("Unable to get table")
    }
}
