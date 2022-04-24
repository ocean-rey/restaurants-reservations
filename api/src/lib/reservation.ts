import { Prisma, Reservation, Table } from "@prisma/client";
import { Reservations, Tables } from "../utils/db";
import { getTables } from "./table";

// note that everything is using gmt +0
export async function getReservations({ page, filters }: GetReservationsParams) {
    const searchParam: Prisma.ReservationFindManyArgs = {
        include: { Table: true },
    }
    page ? () => { searchParam.take = 10; searchParam.skip = (page - 1) * 10 } : null
    filters ? () => {
        const where: Prisma.ReservationWhereInput = {};
        filters.tableId ? () => { where.tableId = filters.tableId } : null;
        (filters.from && filters.to) ? () => { where.startTime = { lte: filters.to, gte: filters.from } } : null;
    } : null
    const reservations = await Reservations.findMany(searchParam) as (Reservation & {
        Table: Table;
    })[]
    const cleanedReservations = reservations.map(({ Table, startTime, endTime, id }) => ({ table: { id: Table.id, numSeats: Table.numSeats }, startTime, endTime }));
    return cleanedReservations;
}

export async function getTodayReservations(sort: "asc" | "desc", page: number) {
    const openTime = new Date();
    openTime.setHours(12, 0, 0, 0);
    const closeTime = openTime;
    closeTime.setHours(12, 0, 0, 0);
    const reservations = await Reservations.findMany(
        {
            take: 10,
            skip: (page - 1) * 10,
            where: {
                startTime:
                    { gte: openTime },
                endTime:
                    { lte: closeTime }
            },
            include: { Table: true },
            orderBy: { startTime: sort }
        })
    const cleanedReservations = reservations.map(({ Table, startTime, endTime, id }) => ({ table: { id: Table.id, numSeats: Table.numSeats }, startTime, endTime, id }));
    return cleanedReservations;
}

export async function reserveTable({ startTime, endTime, numSeats }: ReserveTableParams) {
    const minimalTable = await Tables.findFirst({ orderBy: { numSeats: "asc" }, where: { numSeats: { gte: numSeats } } })
    if (!minimalTable) {
        return { error: "No table with that many seats exists!" }
    }
    const availableTable = await Tables.findFirst(
        {
            orderBy: { numSeats: "asc" },
            where: {
                reservations:
                {
                    none: {
                        endTime: { lte: endTime, gte: startTime },
                        startTime: { lte: endTime, gte: startTime }
                    }
                },
                numSeats: minimalTable.numSeats
            }
        })
    if (!availableTable) {
        return { error: "No table available with specified parameters!" }
    }
    const reservation = await Reservations.create({ data: { tableId: availableTable.id, startTime, endTime } })
    return reservation
}

export async function getAvailableSlots(numSeats: number) {
    const currentDate = new Date();
    if (currentDate.getHours() > 0 && currentDate.getHours() < 12) {
        currentDate.setHours(12, 0, 0, 0);
    }
    const closingDate = new Date(currentDate)
    closingDate.setHours(23, 59, 59, 59)
    // find minimal table
    const minimalTable = await Tables.findFirst({ orderBy: { numSeats: "asc" }, where: { numSeats: { gte: numSeats } } })
    if (!minimalTable) {
        return { error: `No tables available with numSeats >= ${numSeats}` }
    }
    const minimalSeats = minimalTable.numSeats;
    // get all minimal tables along with thier remaining reservations (for the rest of the day)
    const validTables = await Tables.findMany(
        {
            orderBy:
                { reservations: { _count: "asc" } },
            include: {
                reservations: {
                    where: {
                        endTime: { lte: closingDate, gt: currentDate }
                    }
                }
            },
            where: {
                numSeats: minimalSeats
            }
        })
    // if there exists a minimal table without any reservations; we are done
    if (validTables[0].reservations.length === 0) {
        console.log("There exists a minimal table without any reservations.")
        return [toMeridianTime({ start: currentDate, end: closingDate })] // wrapping in array for consistancy 
    }
    // if not; we have some work to do
    // 2d array
    const timeBlocks: Array<Array<{ start: number, end: number }>> = []
    const closingTime = closingDate.getTime()
    var timeCursor = currentDate.getTime()
    // i hate that this is exponential time but figuring out a linear time solution would take a while
    for (let tIndex = 0; tIndex < validTables.length; tIndex++) {
        const reservations = validTables[tIndex].reservations;
        console.log(reservations)
        timeBlocks[tIndex] = []
        for (let rIndex = 0; rIndex < reservations.length; rIndex++) {
            const currentReservation = reservations[rIndex];
            // special case to handle for the first returned reservation if it starts before current time
            if (rIndex === 0 && currentReservation.startTime.getTime() < timeCursor) {
                console.log("First reservation starts before current time")
                timeCursor = currentReservation.endTime.getTime();
                // if the first reservation is also the last
                if (reservations.length === 1 && Math.abs(timeCursor - closingTime) > 60000) {
                    console.log("No more reservations; using remaining time.")
                    timeBlocks[tIndex].push({ start: timeCursor, end: closingTime })
                }
                continue
            }
            // handle continuous reservations
            if (Math.abs(timeCursor - currentReservation.startTime.getTime()) < 60000) {
                console.log("Skipping continuous reservation.")
                timeCursor = currentReservation.endTime.getTime();
                //  if there are no more remaining reservations, use remaining time before continuing
                if (rIndex === reservations.length - 1 && Math.abs(timeCursor - closingTime) > 60000) {
                    console.log("No more reservations; using remaining time.")
                    timeBlocks[tIndex].push({ start: timeCursor, end: closingTime })
                }
                continue
            }
            console.log("No edge cases found, continuing normally.")
            timeBlocks[tIndex].push({ start: timeCursor, end: currentReservation.startTime.getTime() })
            timeCursor = currentReservation.endTime.getTime();
            // check for remaining time if we naturally reached the end of the reservation list
            if (rIndex === reservations.length - 1 && Math.abs(timeCursor - closingTime) > 60000) {
                console.log("No more reservations; using remaining time.")
                timeBlocks[tIndex].push({ start: timeCursor, end: closingTime })
            }
        }
    }
    // timeBlocks are set up; now we need to clean up.
    const blockStrings: Array<string> = removeDuplicates(
        timeBlocks.flat().map(({ start, end }) => toMeridianTime({ start: new Date(start), end: new Date(end) }))
    )
    return blockStrings
}

function toMeridianTime({ start, end }: { start: Date, end: Date }) {
    return `${start.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}`
}

function removeDuplicates(arr: Array<any>) {
    const uniqueArr: Array<any> = []
    for (let i = 0; i < arr.length; i++) {
        if (uniqueArr.includes(arr[i])) {
            continue
        } else {
            uniqueArr.push(arr[i])
        }
    }
    return uniqueArr
}

type AvailableSlots = Array<{ from: string, to: string }>

type ReserveTableParams = {
    startTime: Date;
    endTime: Date;
    numSeats: number
}

type GetReservationsParams = {
    page: number | undefined,
    filters: {
        to: Date,
        from: Date,
        tableId: number
    } | undefined
}