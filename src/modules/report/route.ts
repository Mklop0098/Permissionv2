import ReportController from "./controller";
import { IRoute } from "@core/interfaces";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import { Report } from "./dtos/create.dto";

class EvaluateRoute implements IRoute {
    public path = '/report';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public reportController = new ReportController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.get(this.path + '/reason', this.reportController.getAllReportReason)
        this.router.post(this.path + '/', AuthMiddleware.authorizationStrict(), errorMiddleware(Report, 'body', false), this.reportController.report)
    }
}

export default EvaluateRoute;   