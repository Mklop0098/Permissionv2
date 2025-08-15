import errorMessages from "@core/config/constants";
import { sendResponse } from "@core/utils";
import { Request, Response, NextFunction } from "express";

const multer = require('multer');
const uploadArray = multer({
    limit: {
        fileSize: process.env.MAX_FILE_SIZE || 1024 * 1024 * 10
    }
}).array('files', parseInt(process.env.MAX_FILE_UPLOAD || '10'));

const uploadSingle = multer({
    limit: {
        fileSize: process.env.MAX_FILE_SIZE || 1024 * 1024 * 10
    }
}).single('file');

namespace uploadFileMiddleware {
    export const array = async (req: Request, res: Response, next: NextFunction) => {
        uploadArray(req, res, (err: Error) => {
            if (err instanceof multer.MulterError && (err as any).code === 'LIMIT_FILE_SIZE') {
                return sendResponse(res, 400, errorMessages.LIMIT_FILE_SIZE, null, 'files');
            }
            if (err instanceof multer.MulterError && (err as any).code === 'LIMIT_UNEXPECTED_FILE') {
                return sendResponse(res, 400, errorMessages.FILE_OVER_LIMIT, null, 'files');
            }
            next();
        });
    }
    export const single = async (req: Request, res: Response, next: NextFunction) => {
        uploadSingle(req, res, (err: Error) => {
            if (err instanceof multer.MulterError && (err as any).code === 'LIMIT_FILE_SIZE') {
                return sendResponse(res, 400, errorMessages.LIMIT_FILE_SIZE, null, 'file');
            }
            if (err instanceof multer.MulterError && (err as any).code === 'LIMIT_UNEXPECTED_FILE') {
                return sendResponse(res, 400, errorMessages.FILE_OVER_LIMIT, null, 'file');
            }
            next();
        });
    }
}

export default uploadFileMiddleware;