import { CustomValidator } from "express-validator"
import { Reservations, Tables, Users } from "./utils/db"

export const isNewEmployee: CustomValidator = value => {
    try {
        if (!value) {
            return Promise.reject("No id provided")
        }
        return Users.findUnique({ where: { empNumber: value } }).then((user => {
            if (user) {
                return Promise.reject("Employee ID already in use")
            }
        }))
    } catch (error) {
        // technically should be a no-op
        // logging just in case
        console.error(error)
    }
}

export const isNewTable: CustomValidator = value => {
    try {
        if (!value && value != '0') {
            return Promise.reject("No id provided")
        }
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
        if (!value && value != '0') {
            return Promise.reject("No id provided")
        }
        value = parseInt(value)
        return Tables.findUnique({ where: { id: value } }).then((table => {
            if (!table) {
                return Promise.reject("Table doesn't exist")
            }
        }))
    } catch (error) {
        // logging just in case
        console.log("tableExists validator error")
        console.error(error)
        return Promise.reject("Unable to get table")
    }
}

export const noReservations: CustomValidator = value => {
    // requirment: "Do not allow a table to be deleted if the table has any reservations to it."
    // conflicting requirment: The API shouldn't allow the deletion of a reservation in the past
    // result: if a table at any point ever had a reservation; it cannot be deleted. this could be solved
    // if the first requirment is reworded: Do not allow a table to be deleted if the table has any /future/ reservations."
    // for now; i will build according to the design document but this should be re-analyzed
    try {
        if (!value && value != '0') {
            return Promise.reject("No id provided")
        }
        value = parseInt(value)
        return Reservations.count({ where: { tableId: value } }).then((count) => {
            if (count != 0) {
                return Promise.reject("Cannot delete table with reservations")
            }
        })
    } catch (error) {
        console.log("noReservations validator error")
        console.error(error)
        return Promise.reject("Unable to tell if table has reservations")
    }
}

export const validReservationFilters: CustomValidator = (value, meta) => {
    try {
        if(!value){
            return
        }
        // to xand from
        if (value.to) {
            if (!value.from) {
                return Promise.reject("Cannot have filters.to without filters.from")
            }
        }
        if (value.from) {
            if (!value.to) {
                return Promise.reject("Cannot have filters.from without filters.to")
            }
        }
        // check that tableId is a number
        if (value.tableId) {
            if (typeof value.tableId != "number") {
                return Promise.reject("tableId must be a number")
            }
        }

    } catch (error) {
        console.log("validReservationFilters validator error");
        console.error(error);
        // likely a no op
    }
}
