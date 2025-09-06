import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { LikeRating } from "./dtos/create.dto";
import { withTransaction } from "@core/utils/withTransaction";

class LikeRatingServices {
    private tableName = 'like_rate_history';

    public likeRating = async (model: LikeRating, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            const [checkExist] = await connection.execute<RowDataPacket[]>(`
                SELECT * FROM ${this.tableName} 
                WHERE evaluate_id = ? AND customer_id = ? AND product_id = ? AND source = ?`, [model.evaluate_id, model.customer_id, model.product_id, process.env.SOURCE!]);
                
            console.log(checkExist);
            
            if (checkExist.length > 0) {
                const query = `UPDATE ${this.tableName} SET \`like\` = ${checkExist[0].like == 1 ? 0 : 1} WHERE evaluate_id = ? AND customer_id = ? AND product_id = ? AND source = ?`;
                await connection.execute<ResultSetHeader>(query, [model.evaluate_id, model.customer_id, model.product_id, process.env.SOURCE!]);
            } else {
                const query = `
                    INSERT INTO ${this.tableName} (evaluate_id, customer_id, product_id, source, \`like\`)
                    VALUES (?, ?, ?, ?, ?)
                `;
                await connection.execute<ResultSetHeader>(query, [model.evaluate_id, model.customer_id, model.product_id, process.env.SOURCE!, 1]);
            }
        }, conn);
    }

    public checkAlreadyLike = async (evaluate_id: number, customer_id: number, product_id: number, conn?: PoolConnection) => {
        return await withTransaction(async (connection) => {
            if (!customer_id) {
                const [totalLikes] = await connection.execute<RowDataPacket[]>(`
                    SELECT IFNULL(SUM(\`like\`), 0) AS total_likes
                    FROM ${this.tableName}
                    WHERE evaluate_id = ? 
                    AND product_id = ?
                    AND source = ?;
                `, [evaluate_id, product_id, process.env.SOURCE!]);
                return {
                    total_likes: totalLikes[0].total_likes,
                    user_liked: 0
                }
            }
            const [checkExist] = await connection.execute<RowDataPacket[]>(`
                SELECT
                    SUM(\`like\`) AS total_likes,
                    MAX(CASE WHEN customer_id = ? THEN \`like\` ELSE 0 END) AS user_liked
                FROM ${this.tableName}
                WHERE evaluate_id = ? 
                AND product_id = ?
                AND source = ?
            `, [customer_id, evaluate_id, product_id, process.env.SOURCE!]);
            if (checkExist.length > 0) {
                return {
                    total_likes: checkExist[0].total_likes,
                    user_liked: checkExist[0].user_liked
                }
            }
            return {
                total_likes: 0,
                user_liked: 0
            }
        }, conn);
    }
}

export default LikeRatingServices;

