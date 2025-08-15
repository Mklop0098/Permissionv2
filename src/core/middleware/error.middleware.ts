import { Request, Response, NextFunction } from "express";
import { HttpException } from "@core/exceptions";
import Logger from "@core/utils/logger";

const errorMiddleware = (error: HttpException, req: Request, res: Response, next: NextFunction) => {
    const status = error.status || 500;
    const message = error.message || "Something went wrong";
    Logger.error(`[ERROR] - Status: ${status} - Msg: ${message}`);
    res.status(status).json({
        message
    });
};
export default errorMiddleware;