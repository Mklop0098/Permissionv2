import LikeRatingController from "./controller";
import { IRoute } from "@core/interfaces";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import { LikeRating } from "./dtos/create.dto";

class LikeRatingRoute implements IRoute {
    public path = '/like-rating';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public likeRatingController = new LikeRatingController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(this.path + '/', AuthMiddleware.authorizationStrict(), errorMiddleware(LikeRating, 'body', false), this.likeRatingController.likeRating)
    }
}

export default LikeRatingRoute;   