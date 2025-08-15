import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { Create } from "./dtos/create.dto";
import { checkExist, checkExistConn } from "@core/utils/checkExist";
import errorMessages from "@core/config/constants";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
class EventStorageService {
    private tableName = 'event_storage';
    public create = async (conn: PoolConnection, model: Create) => {
        console.log(model)
        try {
            const query = `insert into ${this.tableName} (table_name, event_type, data, transaction_code) values (?, ?, ?, ?)`;
            const values = [model.table_name, model.event_type, JSON.stringify(model.data || {}), model.transaction_code];
            const [result] = await conn.query<ResultSetHeader>(query, values);
            if (result.affectedRows === 0) {
                throw new HttpException(400, "Lỗi khi tạo event storage");
            }
        } catch (error) {
            throw new HttpException(500, "Lỗi khi tạo event storage");
        }
    }

    public rollbackTransaction = async (transaction_code: string) => {
        const conn = await database.getConnection();
        try {
            await conn.beginTransaction();
            // Lấy tất cả các event thuộc transaction
            const [events] = await conn.query<RowDataPacket[]>(`
                SELECT * FROM event_storage 
                WHERE transaction_code = ? 
                ORDER BY id DESC
            `, [transaction_code]);

            for (const event of events) {
                const tableName = event.table_name;
                const eventType = event.event_type;
                console.log(event.data)
                const data = event.data; // dữ liệu cũ trước khi thay đổi

                if (eventType === 'create') {
                    // Nếu event là tạo mới → rollback = xóa record
                    const id = data.id;
                    if (!id) continue;
                    await conn.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);
                } else if (eventType === 'update') {
                    // Nếu event là update → rollback = update về dữ liệu cũ
                    const id = data.id;
                    if (!id) continue;

                    const keys = Object.keys(data).filter(key => key !== 'id');
                    const values = keys.map(key => data[key]);
                    const setClause = keys.map(key => `\`${key}\` = ?`).join(', ');
                    console.log(`UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`, [...values, id])
                    await conn.query(
                        `UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`,
                        [...values, id]
                    );
                } else if (eventType === 'delete') {
                    // Nếu event là xóa → rollback = insert lại dữ liệu
                    const keys = Object.keys(data);
                    const values = keys.map(key => data[key]);
                    const fields = keys.map(key => `\`${key}\``).join(', ');
                    const placeholders = keys.map(() => '?').join(', ');

                    await conn.query(
                        `INSERT INTO \`${tableName}\` (${fields}) VALUES (${placeholders})`,
                        values
                    );
                }
            }
            await conn.commit();
        } catch (error: any) {
            console.error("Rollback failed:", error.message);
            await conn.rollback();
            return new HttpException(400, errorMessages.ROLLBACK_TRANSACTION_FAILED);
        } finally {
            conn.release();
        }
    }
}

export default EventStorageService;
