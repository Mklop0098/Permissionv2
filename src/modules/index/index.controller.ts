import { sendResponse } from "@core/utils";
import { Request, Response, NextFunction } from "express"

export default class IndexController {
    public index = (req: Request, res: Response, next : NextFunction) => {
        try {
            sendResponse(res, 200, "Welcome to Server");
        } catch (error) {   
            next(error);
        }
    }
}