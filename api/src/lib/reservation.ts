import { Reservations, Tables } from "../utils/db";
import { getTables } from "./table";

// note that everything is using gmt +0
export async function getReservations(page?: number) {
    const reservations = await Reservations.findMany(
        {
            take: 10,
            skip: page ? page * 10 : 0,
            include: { Table: true }
        });
    const cleanedReservations = reservations.map(({ Table, startTime, endTime, id }) => ({ table: { id: Table.id, numSeats: Table.numSeats }, startTime, endTime }));
    return cleanedReservations;
}

export async function getTodayReservations(sort: "asc" | "desc", page?: number) {
    const today = new Date();
    const todayString = `${today.getFullYear}-${today.getMonth}-${today.getDate}`
    const openTime = "T12:00"
    const closeTime = "T23:59"
    const reservations = await Reservations.findMany(
        {
            take: 10,
            skip: page ? page * 10 : 0,
            where: {
                startTime:
                    { gte: todayString + openTime },
                endTime:
                    { lte: todayString + closeTime }
            },
            include: { Table: true },
            orderBy: { startTime: sort }
        })
    const cleanedReservations = reservations.map(({ Table, startTime, endTime, id }) => ({ table: { id: Table.id, numSeats: Table.numSeats }, startTime, endTime }));
    return cleanedReservations;
}

export async function reserveTable({ startTime, endTime, numSeats }: ReserveTableParams) {
    const minimalTable = await Tables.findFirst({ orderBy: { numSeats: "asc" }, where: { numSeats: { gte: numSeats } } })
    if (!minimalTable) {
        throw new Error("No table with that many seats exists!")
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
        throw new Error("No table available with specified parameters!")
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
    closingDate.setHours(23, 59, 0, 0)

    // find minimal table
    const minimalTable = await Tables.findFirst({ orderBy: { numSeats: "asc" }, where: { numSeats: { gte: numSeats } } })
    if (!minimalTable) {
        throw new Error(`No tables available with numSeats >= ${numSeats}`)
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
        timeBlocks[tIndex] = []
        for (let rIndex = 0; rIndex < reservations.length; rIndex++) {
            const currentReservation = reservations[rIndex];
            // special case to handle for the first returned reservation if it starts before current time
            if (rIndex === 0 && currentReservation.startTime.getTime() < timeCursor) {
                timeCursor = currentReservation.endTime.getTime();
                continue
            }
            // handle continuous reservations
            if (Math.abs(timeCursor - currentReservation.startTime.getTime()) < 6e4) {
                timeCursor = currentReservation.endTime.getTime();
                continue
            }
            timeBlocks[tIndex].push({ start: timeCursor, end: currentReservation.startTime.getTime() })
            timeCursor = currentReservation.endTime.getTime();
            // handle when there are no more reservations but there is some extra time at eod
            if (rIndex === reservations.length - 1 && timeCursor < closingTime) {
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