import UserController from "./controller";
import { IRoute } from "@core/interfaces";
import { errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import EventStorageController from "./controller";

class EventStorageRoute implements IRoute {
    public path = '/event-storage';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public eventStorageController = new EventStorageController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(this.path + '/rollback', this.eventStorageController.rollbackTransaction)
    }
}

export default EventStorageRoute;   