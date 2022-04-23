import { Reservations, Tables } from "../utils/db";
import { getTables } from "./table";


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

export async function getTodayReservations(page?: number) {
    // note that this function uses server time
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
            include: { Table: true }
        })
    const cleanedReservations = reservations.map(({ Table, startTime, endTime, id }) => ({ table: { id: Table.id, numSeats: Table.numSeats }, startTime, endTime }));
    return cleanedReservations;
}

export async function reserveTable({ startTime, endTime, numSeats }: ReserveTableParams) {
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
                numSeats: { gte: numSeats }
            }
        })
    if (!availableTable) {
        throw new Error("No table available with specified parameters!")
    }
}

type ReserveTableParams = {
    startTime: Date;
    endTime: Date;
    numSeats: number
}