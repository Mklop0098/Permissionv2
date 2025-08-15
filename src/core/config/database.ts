import Logger from "@core/utils/logger";
import mysql, { RowDataPacket } from "mysql2/promise";
import message from "@core/config/constants";
import { ConvertToObj } from "@core/utils/convertQueryToObj";

class Database {
    private pool: mysql.Pool | null = null;
    private tableActionHistory = "action_history";

    async connectDB() {
        const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_CONNECTION_LIMIT } = process.env;
        try {
            this.pool = mysql.createPool({
                host: DB_HOST,
                user: DB_USER,
                password: DB_PASSWORD,
                database: DB_NAME,
                waitForConnections: true,
                connectionLimit: DB_CONNECTION_LIMIT ? parseInt(DB_CONNECTION_LIMIT) : 100,
                queueLimit: 0,
                connectTimeout: 60000,
            });
            await this.getConnection()
            Logger.info("Connected to DB successfully");
        } catch (error) {
            Logger.error("Failed to connect to DB", error);
            throw error;
        }
    }
    async getConnection() {
        if (this.pool)
            return await this.pool.getConnection();
        throw new Error("get connection failed");
    }
    async closeConnection(connection: mysql.PoolConnection) {
        try {
            if (connection) {
                connection.release();
            }
        } catch (error) {
            Logger.error("close connection failed");
            throw error;
        }
    }
    async executeQuery(query: string, params?: any[]) {
        let connection: mysql.PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            const [results] = await connection.execute(query, params);
            return results;
        } catch (error) {
            Logger.error("execute query failed", error);
            throw error;
        } finally {
            if (connection) {
                await this.closeConnection(connection);
            }
        }
    }
    async query(query: string, params?: any[]) {
        let connection: mysql.PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            const [results] = await connection.query(query, params);
            return results;
        } catch (error) {
            Logger.error("query failed");
            throw error;
        } finally {
            if (connection) {
                await this.closeConnection(connection);
            }
        }
    }
    async queryOne(query: string, params?: any[]) {
        let connection: mysql.PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            const result = await connection.query(query, params);
            return result
        } catch (error) {
            Logger.error("query one failed");
            throw error;
        } finally {
            if (connection) {
                await this.closeConnection(connection);
            }
        }
    }
    async executeQueryLog(query: string, params?: any[] | undefined, log?: { action: string, user_id: number, module_id: number, des?: any }) {
        let des: any = log?.des || null;
        let connection: mysql.PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            if (log?.action == message.DELETE) {
                const info = ConvertToObj.convertDeleteQueryToObject(query, params);
                if (info.tableName && info.id) {
                    const item = await connection.execute(`select * from ${info.tableName} where id = ?`, [info.id]);
                    des = ((item as RowDataPacket)[0][0]) ? JSON.stringify((item as RowDataPacket)[0][0]) : {};
                }
            }
            if (log?.action == message.UPDATE_STATUS) {
                const info = ConvertToObj.convertUpdateStatusQueryToObject(query, params);
                if (info.tableName && info.id) {
                    const item = await connection.execute(`select * from ${info.tableName} where id = ?`, [parseInt(info.id)]);
                    if ((item as RowDataPacket)[0][0].publish != undefined) {
                        des = {
                            id: (item as RowDataPacket)[0][0].id, // id
                            name: (item as RowDataPacket)[0][0].name,
                            publish: (item as RowDataPacket)[0][0].publish
                        }
                        des = JSON.stringify(des);
                    } else if ((item as RowDataPacket)[0][0].status != undefined) {
                        des = {
                            name: (item as RowDataPacket)[0][0].name,
                            status: (item as RowDataPacket)[0][0].status
                        }
                        des = JSON.stringify(des);
                    }
                }
            }
            const [results] = await connection.execute(query, params)
            if (log) {
                const { user_id, action, module_id } = log
                if (user_id == null || action == null || module_id == null) {

                    Logger.error("Missing params");
                    return
                }
                if (action == message.UPDATE) {
                    const descripton = ConvertToObj.convertUpdateQueryToObj(query, params!);
                    des = JSON.stringify(descripton);
                }
                if (action == message.CREATE) {
                    const descripton = ConvertToObj.convertCreateQueryToObject(query, params!);
                    // des = (descripton && descripton.name) ? descripton.name : JSON.stringify(descripton);
                    if ((results as mysql.ResultSetHeader).affectedRows != 0) {
                        des = descripton.id = (results as mysql.ResultSetHeader).insertId;
                    }
                    des = (descripton) ? JSON.stringify(descripton) : {};
                    ////console.log("result", results);

                }
                if (action == message.DELETE_LIST || action == message.UPDATE_LIST_STATUS) {
                    ////console.log("action", action);
                    ////console.log("params", params);
                    ////console.log("query", query);
                    ////console.log("results", results);
                    ////console.log("des", des);
                    des = JSON.stringify(des)
                }
                const created_at = new Date();
                const insertQuery = `insert into ${this.tableActionHistory} (user_id, action, module_id, des, created_at) values (?, ?, ?, ?, ?)`;
                connection.execute(insertQuery, [user_id ?? 0, action, module_id, des, created_at]);
            }
            return results;
        } catch (error) {
            Logger.error("execute query failed", error);
            throw error;
        } finally {
            if (connection) {
                await this.closeConnection(connection);
            }
        }
    }
    async log(log: { action: string, user_id: number, module_id: number, des?: any }) {
        let connection: mysql.PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            const { user_id, action, module_id, des } = log
            if (user_id == null || action == null || module_id == null) {
                Logger.error("Missing params");
                return
            }
            let descripton = des ? JSON.stringify(des) : null;
            const created_at = new Date()
            const insertQuery = `insert into ${this.tableActionHistory} (user_id, action, module_id, des, created_at) values (?, ?, ?, ?, ?)`;
            connection.execute(insertQuery, [user_id ?? 0, action, module_id, descripton, created_at]);
        } catch (error) {
            Logger.error("log failed", error);
            throw error;
        } finally {
            if (connection) {
                await this.closeConnection(connection);
            }
        }
    }
    async executeQueryHistory(query: string, params?: any[] | undefined, log?: { action: string, user_id: number, module_id: number, seller_id?: number, des?: any, reference_id?: number, reason?: string }) {
        let des: any = log?.des || null;
        let connection: mysql.PoolConnection | null = null;
        try {
            connection = await this.getConnection();
            const [results] = await connection.execute(query, params) as any;
            //console.log("results", results);
            //console.log("log", log,);
            if (log) {
                const { user_id, action, module_id, reference_id, reason, seller_id } = log
                if (user_id == null || action == null || module_id == null) {
                    Logger.error("Missing params");
                    return
                }

                const created_at = new Date();
                const insertQuery = `insert into ${this.tableActionHistory} (user_id, action, module_id, des, created_at, reference_id, reason, seller_id) values (?, ?, ?, ?, ?, ?, ?, ?)`;
                if (reference_id) {
                    await this.executeQuery(insertQuery, [user_id ?? 0, action, module_id, des, created_at, reference_id, reason || null, seller_id || null]);
                } else {
                    await this.executeQuery(insertQuery, [user_id ?? 0, action, module_id, des, created_at, results.insertId || null, reason || null, seller_id || null]);
                }
            }
            return results;
        } catch (error) {
            Logger.error("execute query failed", error);
            throw error;
        } finally {
            if (connection) {
                await this.closeConnection(connection);
            }
        }
    }

}

export default new Database();
