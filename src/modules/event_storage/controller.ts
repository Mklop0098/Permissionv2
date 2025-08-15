import UserServices from "./service";
import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";

import message from "@core/config/constants";
class EventStorageController {
    public userServices = new UserServices();

    public rollbackTransaction = async (req: Request, res: Response, next: NextFunction) => {
        const transaction_code = req.body.transaction_code as string;
        try {
            const result = await this.userServices.rollbackTransaction(transaction_code);
            if (result instanceof Error && result.field)
                return sendResponse(res, result.status, result.message, null, result.field);
            if (result instanceof Error)
                return sendResponse(res, result.status, result.message);
            return sendResponse(res, 200, message.ROLLBACK_TRANSACTION_SUCCESS, result);
        } catch (error) {
            next(error);
        }
    }
}
export default EventStorageController;