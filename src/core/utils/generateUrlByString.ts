import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { checkExist, checkExistConn } from "./checkExist";
import { HttpException } from "@core/exceptions";

export const generateURLByName = async (conn: PoolConnection, text: string, tableName: string) => {
    try {
        let check;
        let url = text
            .toString()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "")
            .replace(/-+/g, "")
            .replace(/^-+|-+$/g, "");
        do {
            if (check) {
                url = url + Math.floor(Math.random() * 1000);
            }
            check = await checkExistConn(conn, tableName, "url", url);
        } while (check && (check as any as RowDataPacket[]).length > 0);
        return url;
    } catch (error: any) {
        throw new HttpException(400, error.message, error.field);
    }
}