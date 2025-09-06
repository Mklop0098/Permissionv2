import EvaluateController from "./controller";
import { IRoute } from "@core/interfaces";
import { AuthMiddleware, errorMiddleware } from "@core/middleware";
import { Router } from "express";
import multer from "multer";
import { Create } from "./dtos/create.dto";
import { Update } from "./dtos/update.dto";

class EvaluateRoute implements IRoute {
    public path = '/evaluate';
    public router = Router();
    public upload = multer({ storage: multer.memoryStorage() });

    public evaluateController = new EvaluateController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(this.path + '/',
            AuthMiddleware.authorization(),
            this.upload.fields([
                { name: 'files', maxCount: 10 },
            ]),
            errorMiddleware(Create, 'body', false),
            this.evaluateController.create
        )

        this.router.get(this.path + '/check-evaluated', this.evaluateController.checkEvaluated)
        this.router.get(this.path + '/seller-evaluate/:id', this.evaluateController.getSellerEvaluate)
        this.router.get(this.path + '/:order_id', AuthMiddleware.authorizationStrict(), this.evaluateController.findByOrderId)
        this.router.get(this.path + '/get-all/:product_id', AuthMiddleware.authorization(), this.evaluateController.findAllByProductId)
        this.router.delete(this.path + '/delete-one/:id', AuthMiddleware.authorizationStrict(), this.evaluateController.deleteOneImage)
        this.router.put(this.path + '/:id',
            AuthMiddleware.authorization(),
            this.upload.fields([
                { name: 'files', maxCount: 10 },
            ]),
            errorMiddleware(Update, 'body', false),
            this.evaluateController.update
        )
        this.router.delete(this.path + '/delete-comment/:id', AuthMiddleware.authorizationStrict(), this.evaluateController.deleteComment)
        this.router.post(this.path + '/check-toxic', this.evaluateController.checkToxic)
    }
}

export default EvaluateRoute;   