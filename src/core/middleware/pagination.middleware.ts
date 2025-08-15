import { Request, Response, NextFunction } from 'express';
import { IPagination } from '@core/types/express/index';

const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string, 1) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    if (req.query.filters) {
        const filters = JSON.parse(req.query.filters as string);
        req.pagination = { page, limit, filters } as IPagination;
        next();
    }
    else {
        req.pagination = { page, limit } as IPagination;
        next();
    }
};

export default paginationMiddleware;