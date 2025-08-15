import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import { Create } from "./dtos/create.dto";
import message from "@core/config/constants";
import EvaluateServices from "./service";
import { HttpException } from "@core/exceptions";
import { Search } from "./dtos/search.dto";
import { Update } from "./dtos/update.dto";

class EvaluateController {
    public evaluateServices = new EvaluateServices();
    public create = async (req: Request, res: Response, next: NextFunction) => {
        const model: Create = req.body as Create;
        model.customer_id = req.id;
        const listImage = req.files;
        try {
            const result = await this.evaluateServices.create(model, listImage)
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            next(error);
        }
    }

    public upload = async (req: Request, res: Response, next: NextFunction) => {
        console.log(req.files);
        const listImage = req.files;
        const order_id = req.params.order_id as any;
        const cmtId = req.body.cmtId as any;
        try {
            const result = await this.evaluateServices.upload(order_id, listImage, cmtId);
            return sendResponse(res, 200, message.CREATE_SUCCESS, result);
        } catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

    public findByOrderId = async (req: Request, res: Response, next: NextFunction) => {
        const order_id = req.params.order_id as any;
        const customer_id = req.id as number;
        try {
            const result = await this.evaluateServices.findByOrderId(order_id, customer_id);
            return sendResponse(res, 200, message.GET_SUCCESS, result);
        } catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

    public findAllByProductId = async (req: Request, res: Response, next: NextFunction) => {
        const product_id = req.params.product_id as any;
        const model: Search = req.query as Search;
        model.customer_id = req.id as number;
        try {
            const result = await this.evaluateServices.findAllByProductId(product_id, model);
            return sendResponse(res, 200, message.GET_SUCCESS, result);
        } catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

    public deleteOneImage = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any;
        try {
            const result = await this.evaluateServices.deleteOneImage(id);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        }
        catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

    public update = async (req: Request, res: Response, next: NextFunction) => {
        const model: Update = req.body as Update;
        model.order_id = req.params.id as any;
        model.customer_id = req.id as number;
        const listImage = req.files;
        try {
            const result = await this.evaluateServices.update(model, listImage);
            return sendResponse(res, 200, message.UPDATE_SUCCESS, result);
        } catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

    public deleteComment = async (req: Request, res: Response, next: NextFunction) => {
        const id = req.params.id as any;
        try {
            const result = await this.evaluateServices.deleteComment(id);
            return sendResponse(res, 200, message.DELETE_SUCCESS, result);
        }
        catch (error) {
            if (error instanceof HttpException)
                return sendResponse(res, error.status, error.message);
            if (error instanceof Error)
                return sendResponse(res, 500, error.message);
            next(error)
        }
    }

    public checkToxic = async (req: Request, res: Response, next: NextFunction) => {
        const text = req.body.text as string;
        try {
            const result = await this.evaluateServices.checkToxic(text);
            return sendResponse(res, 200, message.GET_SUCCESS, result);
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
export default EvaluateController;