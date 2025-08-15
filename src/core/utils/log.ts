import database from "@core/config/database";
import Logger from "./logger";
import message from "@core/config/constants";

export default class Log {
    static tableName = '`action_history`';

    static async log(info?: any) {
        ////console.log("info", info);
        if (!info) {
            return
        }
        // const { user_id, action, module_id, des } = info;
        const user_id = info.user_id;
        const action = info.action;
        const module_id = info.module_id;
        let des: any = info.des;
        if (action == message.CREATE) {
            des = JSON.stringify(des)
        }
        if (action == message.UPDATE_STATUS || action == message.DELETE_LIST || action == message.UPDATE_LIST_STATUS || action == message.UPDATE) {
            des = JSON.stringify(des)
        }

        if (user_id == null || action == null || module_id == null || des == null) {
            Logger.error("Missing params");
            return;
        }
        const created_at = new Date();

        const query = `insert into ${this.tableName} (user_id, action, module_id, des, created_at) values (?, ?, ?, ?, ?)`;
        database.executeQuery(query, [user_id, action, module_id, des, created_at]);

    }
}
