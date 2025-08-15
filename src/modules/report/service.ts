import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Report } from "./dtos/create.dto";
import { withTransaction } from "@core/utils/withTransaction";

class EvaluateServices {
    private tableName = 'report';

    public getAllReportReason = async (conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const query = `SELECT id, reason FROM report_reason`;
            const [result] = await connection.execute<RowDataPacket[]>(query);
            return {
                data: result
            };
        }, conn);
    }

    public report = async (model: Report, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const query = `INSERT INTO report (evaluate_id, repoter_id, reason_id, detail) VALUES (?, ?, ?, ?)`;
            await connection.execute<ResultSetHeader>(query, [model.evaluate_id, model.repoter_id, model.reason_id, model.detail || null]);
        }, conn);
    }
}

export default EvaluateServices;

