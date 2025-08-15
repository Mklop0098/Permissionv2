import Ilog from "@core/interfaces/log.interface";
import database from "../config/database";
import { PoolConnection } from 'mysql2/promise';

export const writeLog = async (conn: PoolConnection, log: Ilog) => {
    try {
        const { user_id, action, des, seller_id, reference_id, reason } = log;
        const insertQuery = `insert into action_history (user_id, action, module_id, des, created_at, reference_id, reason, seller_id) values (?, ?, ?, ?, ?, ?, ?, ?)`;
        await conn.query(insertQuery, [user_id, action, 39, des || null, new Date(), reference_id || null, reason || null, seller_id || null]);
    } catch (error) {
        console.log(error);
    }

}   