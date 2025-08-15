import { HttpException } from "@core/exceptions";
import { sendResponse } from "@core/utils";
import { Logger } from "@core/utils";
import { plainToClass } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Request, Response, NextFunction, RequestHandler } from "express";

const errorMiddleware = (type: any, location: 'body' | 'params' | 'query' = 'body', skipMissingProperties = false): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
        let data;
        switch (location) {
            case 'body':
                data = req.body;
                break;
            case 'params':
                data = req.params;
                break;
            case 'query':
                data = req.query;
                break;
            default:
                return next(new HttpException(400, 'invalid location'))
        }
        if (!data) {
            return next(new HttpException(400, `${location} is missing`))
        }

        const dtoInstance = plainToClass(type, data);
        ////console.log(validate(dtoInstance, {skipMissingProperties}))
        validate(dtoInstance, { skipMissingProperties }).then((errors: ValidationError[]) => {
            ////console.log(errors)
            if (errors.length > 0) {
                Logger.error('Validation errors:', errors);
                const message = errors[0].constraints ? errors[0].constraints[Object.keys(errors[0].constraints)[0]] : 'invalid data';
                sendResponse(res, 400, message, null, errors);
            } else {
                next();
            }
        }).catch((error: Error) => {
            Logger.error('Error Middleware:', error);
            return sendResponse(res, 500, 'server error');
        });
    }
}

export default errorMiddleware;