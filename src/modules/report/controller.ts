import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import { Report } from "./dtos/create.dto";
import message from "@core/config/constants";
import ReportServices from "./service";
import { HttpException } from "@core/exceptions";

class ReportController {
    public reportServices = new ReportServices();
    public getAllReportReason = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await this.reportServices.getAllReportReason()
            return sendResponse(res, 200, message.GET_SUCCESS, result);
        } catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error);
        }
    }   

    
    public report = async (req: Request, res: Response, next: NextFunction) => {
        const model: Report = req.body as Report;
        model.repoter_id = req.id as number;
        try {
            const result = await this.reportServices.report(model);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        }
        catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

}
export default ReportController;