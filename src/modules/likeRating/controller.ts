import { Request, Response, NextFunction } from "express";
import { sendResponse } from "@core/utils";
import { LikeRating } from "./dtos/create.dto";
import message from "@core/config/constants";
import LikeRatingServices from "./service";
import { HttpException } from "@core/exceptions";

class LikeRatingController {
    public likeRatingServices = new LikeRatingServices();

    
    public likeRating = async (req: Request, res: Response, next: NextFunction) => {
        const model: LikeRating = req.body as LikeRating;
        model.customer_id = req.id as number;
        try {
            const result = await this.likeRatingServices.likeRating(model);
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
export default LikeRatingController;