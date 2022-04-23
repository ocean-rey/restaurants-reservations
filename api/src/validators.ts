import { CustomValidator } from "express-validator"
import { Tables, Users } from "./utils/db"

export const isNewEmployee: CustomValidator = value => {
    return Users.findUnique({ where: { empNumber: value } }).then((user => {
        if (user) {
            return Promise.reject("Employee ID already in use")
        }
    }))
}

export const isNewTable: CustomValidator = value => {
    return Tables.findUnique({ where: { id: value } }).then((table => {
        if (table) {
            return Promise.reject("Table ID already exists")
        }
    }))
}

export const tableExists: CustomValidator = value => {
    return Tables.findUnique({where: {id: value}}).then((table => {
        if(!table){
            return Promise.reject("Table does not exist")
        }
    }))
}