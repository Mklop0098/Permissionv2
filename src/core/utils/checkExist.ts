import database from "@core/config/database";
import { RowDataPacket } from "mysql2";
import { PoolConnection } from "mysql2/promise";

export const checkExist = async (tableName: string, column: string, value: string | number, id?: string | number) => {
    let query = `SELECT * FROM ${tableName} WHERE ${column} = ?`;
    const params: any[] = [value];
    if (id) {
        query += ` AND id != ?`
        params.push(id);
    }
    const checkExist = await database.executeQuery(query, params);
    if (Array.isArray(checkExist) && checkExist.length > 0)
        return checkExist as RowDataPacket[0];
    return false
}

export const checkExistConn = async (conn: PoolConnection, tableName: string, column: string, value: string | number, id?: string | number, seller_id?: number) => {
    let query = `SELECT * FROM ${tableName} WHERE ${column} = ?`;
    const params: any[] = [value];
    if (id) {
        query += ` AND id != ?`
        params.push(id);
    }
    if (seller_id) {
        query += ` AND ${seller_id ? 'seller_id = ?' : 'seller_id IS NULL'}`
        params.push(seller_id);
    }
    const [checkExist] = await conn.query<RowDataPacket[]>(query, params);
    if (Array.isArray(checkExist) && checkExist.length > 0)
        return checkExist as RowDataPacket[0];
    return false
}

export const checkSellerEntityExist = async (tableName: string, column: string, value: string | number, seller_id: number) => {
    let query = `SELECT * FROM ${tableName} WHERE ${column} = ?`;
    const params: any[] = [value];
    query += ` AND seller_id = ?`
    params.push(seller_id);
    const checkExist = await database.executeQuery(query, params);
    if (Array.isArray(checkExist) && checkExist.length > 0)
        return checkExist as RowDataPacket[0];
    return false
}