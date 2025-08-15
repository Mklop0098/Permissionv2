import { IPagiantion } from "@core/interfaces/pagination.interface";

export const caculatePagination = (count: number, page: number, limit: number) => {
    if (page && limit) {
        let pagination: IPagiantion = {
            page: page * 1 || 1,
            limit: limit * 1 || 10,
            totalPage: 0
        }
        const totalPages = Math.ceil(count / limit) || 0;
        if (count > 0) {
            pagination.totalPage = totalPages
        }
        return pagination
    }
    return {
        page: page * 1 || 1,
        limit: limit * 1 || 10,
        totalPage: 0
    }
}