import { HttpException } from "@core/exceptions";
import database from "@core/config/database";
import { RowDataPacket } from "mysql2";

const mapIdToObj = async (sql: string, data: any, fieldNameId: string): Promise<any> => {
    const mapId = (data as any[]).map(async item => {
        let id: number = parseInt(item[fieldNameId]);
        let rs = await database.executeQuery(sql, [id])
        if (Array.isArray(rs) && rs.length === 0)
            return new HttpException(400, 'Không tìm thấy dữ liệu')
        return (rs as RowDataPacket[])[0]
    });
    const details = await Promise.all(mapId);
    if (Array.isArray(data) && data.length > 0) {
        data.forEach((item, index) => {
            (item as RowDataPacket)[fieldNameId] = details[index]
        })
    }
    return data
}
export default mapIdToObj;