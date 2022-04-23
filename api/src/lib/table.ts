import { Tables } from "../utils/db";

export async function getTables() {
    const tables = await Tables.findMany();
    // return an array without meta data like updatedAt and createdAt
    const cleanedUpTables = tables.map(({ numSeats, id }) => ({ numSeats, id }));
    return cleanedUpTables;
}

export async function createTable({ id, numSeats }: CreateTableParams) {
    return Tables.create({ data: { id, numSeats } })
}

export async function deleteTable(id:number){
    return Tables.delete({where: {id}})
}

type CreateTableParams = {
    id: number,
    numSeats: number
}